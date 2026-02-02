import { useEffect, useState } from "react";
import { useInvestmentStore } from "../../stores/investment.store";

import { CRYPTO_LIST } from "../../data/cryptoList";
import { IDX_STOCK_LIST } from "../../data/idxStockList";

export default function AddInvestmentModal({ editInvestment = null, onClose }) {
  const { addInvestment, updateInvestment } = useInvestmentStore();

  /* ======================
     STATE
  ====================== */
  const [type, setType] = useState("crypto");
  
  // Common
  const [symbol, setSymbol] = useState("");
  const [buyDate, setBuyDate] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");

  // Reksadana
  const [fundName, setFundName] = useState("");
  const [fundType, setFundType] = useState("");
  const [platform, setPlatform] = useState("");
  const [investmentAmount, setInvestmentAmount] = useState("");
  const [units, setUnits] = useState("");
  const [navAtPurchase, setNavAtPurchase] = useState("");
  const [currentNAV, setCurrentNAV] = useState("");

  // Deposito
  const [bankName, setBankName] = useState("");
  const [principalAmount, setPrincipalAmount] = useState("");
  const [tenor, setTenor] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [interestPaymentType, setInterestPaymentType] = useState("maturity");
  const [taxRate, setTaxRate] = useState("20");
  const [startDate, setStartDate] = useState("");
  const [autoRollover, setAutoRollover] = useState("none");

  const [symbols, setSymbols] = useState([]);

  /* ======================
     CALCULATIONS
  ====================== */
  // Calculate maturity date for deposito
  const calculateMaturityDate = () => {
    if (!startDate || !tenor) return "";
    
    const start = new Date(startDate);
    const months = parseInt(tenor.replace('m', ''));
    
    const maturity = new Date(start);
    maturity.setMonth(maturity.getMonth() + months);
    
    return maturity.toISOString().split('T')[0];
  };

  const maturityDate = calculateMaturityDate();

  /* ======================
     PREFILL SAAT EDIT
  ====================== */
  useEffect(() => {
    if (!editInvestment) return;

    setType(editInvestment.type);
    setSymbol(editInvestment.symbol || "");
    setBuyDate(editInvestment.buyDate || "");
    setBuyPrice(editInvestment.buyPrice || "");
    setQuantity(editInvestment.quantity || "");
    setNotes(editInvestment.notes || "");
    
    // Reksadana
    setFundName(editInvestment.fundName || "");
    setFundType(editInvestment.fundType || "");
    setPlatform(editInvestment.platform || "");
    setInvestmentAmount(editInvestment.amount || editInvestment.investmentAmount || "");
    setUnits(editInvestment.units || "");
    setNavAtPurchase(editInvestment.navAtPurchase || "");
    setCurrentNAV(editInvestment.currentNAV || "");
    
    // Deposito
    setBankName(editInvestment.bankName || "");
    setPrincipalAmount(editInvestment.amount || editInvestment.principalAmount || "");
    setTenor(editInvestment.tenor || "");
    setInterestRate(editInvestment.interest || editInvestment.interestRate || "");
    setInterestPaymentType(editInvestment.interestPaymentType || "maturity");
    setTaxRate(editInvestment.taxRate || "20");
    setStartDate(editInvestment.startDate || "");
    setAutoRollover(editInvestment.autoRollover || "none");
  }, [editInvestment]);

  /* ======================
     SYMBOL LIST
  ====================== */
  useEffect(() => {
    if (type === "crypto") setSymbols(CRYPTO_LIST);
    else if (type === "stock") setSymbols(IDX_STOCK_LIST);
    else setSymbols([]);
  }, [type]);

  /* ======================
     SUBMIT
  ====================== */
  function handleSubmit(e) {
    e.preventDefault();

    let payload = {
      id: editInvestment?.id,
      type,
      notes: notes.trim() || undefined,
    };

    const selectedItem = symbols.find((s) => s.symbol === symbol);

    if (type === "crypto" || type === "stock") {
      payload = {
        ...payload,
        symbol,
        name: selectedItem?.name || symbol,
        buyDate,
        buyPrice: parseFloat(buyPrice),
        quantity: parseFloat(quantity),
      };
    }

    if (type === "reksadana") {
      payload = {
        ...payload,
        fundName,
        fundType,
        platform: platform || undefined,
        investmentAmount: parseFloat(investmentAmount),
        units: units ? parseFloat(units) : undefined,
        navAtPurchase: navAtPurchase ? parseFloat(navAtPurchase) : undefined,
        currentNAV: currentNAV ? parseFloat(currentNAV) : undefined,
        buyDate,
      };
    }

    if (type === "deposito") {
      payload = {
        ...payload,
        bankName,
        principalAmount: parseFloat(principalAmount),
        tenor,
        interestRate: parseFloat(interestRate),
        interestPaymentType,
        taxRate: parseFloat(taxRate),
        startDate,
        maturityDate,
        autoRollover,
      };
    }

    console.log("SUBMIT PAYLOAD:", payload);

    if (editInvestment) {
      updateInvestment(payload);
    } else {
      addInvestment(payload);
    }

    onClose();
  }

  /* ======================
     UI
  ====================== */
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-lg rounded-xl p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-800">
          {editInvestment ? "Edit Investment" : "Add Investment"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* TYPE */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Investment Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 bg-white"
            >
              <option value="crypto">Crypto</option>
              <option value="stock">Stock</option>
              <option value="reksadana">Reksadana</option>
              <option value="deposito">Deposito</option>
            </select>
          </div>

          {(type === "crypto" || type === "stock") && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Symbol
                </label>
                <select
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 bg-white"
                >
                  <option value="">Select symbol</option>
                  {symbols.map((item) => (
                    <option key={item.symbol} value={item.symbol}>
                      {item.symbol} — {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Buy Date
                  </label>
                  <input 
                    type="date" 
                    value={buyDate} 
                    onChange={e => setBuyDate(e.target.value)} 
                    className="w-full border p-3 rounded-lg" 
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Buy Price (per unit)
                  </label>
                  <input 
                    type="number" 
                    value={buyPrice} 
                    onChange={e => setBuyPrice(e.target.value)} 
                    className="w-full border p-3 rounded-lg" 
                    placeholder="e.g., 50000"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity
                </label>
                <input 
                  type="number" 
                  value={quantity} 
                  onChange={e => setQuantity(e.target.value)} 
                  className="w-full border p-3 rounded-lg" 
                  placeholder="e.g., 10"
                  step="0.000001"
                  min="0"
                  required
                />
              </div>
            </>
          )}

          {type === "reksadana" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fund Name *
                </label>
                <input 
                  value={fundName} 
                  onChange={e => setFundName(e.target.value)} 
                  className="w-full border p-3 rounded-lg" 
                  placeholder="e.g., Reksadana Pasar Uang ABC, Reksadana Saham XYZ"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fund Type *
                  </label>
                  <select
                    value={fundType}
                    onChange={e => setFundType(e.target.value)}
                    className="w-full border p-3 rounded-lg"
                    required
                  >
                    <option value="">Select type</option>
                    <option value="pasar-uang">Pasar Uang</option>
                    <option value="pendapatan-tetap">Pendapatan Tetap</option>
                    <option value="campuran">Campuran</option>
                    <option value="saham">Saham</option>
                    <option value="index">Index</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Platform / Asset Manager
                  </label>
                  <input 
                    value={platform} 
                    onChange={e => setPlatform(e.target.value)} 
                    className="w-full border p-3 rounded-lg" 
                    placeholder="e.g., Bibit, Bareksa, Mandiri"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Purchase Date *
                </label>
                <input 
                  type="date" 
                  value={buyDate} 
                  onChange={e => setBuyDate(e.target.value)} 
                  className="w-full border p-3 rounded-lg" 
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Investment Amount (IDR) *
                  </label>
                  <input 
                    type="number" 
                    value={investmentAmount} 
                    onChange={e => setInvestmentAmount(e.target.value)} 
                    className="w-full border p-3 rounded-lg" 
                    placeholder="e.g., 10,000,000"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Units
                  </label>
                  <input 
                    type="number" 
                    value={units} 
                    onChange={e => setUnits(e.target.value)} 
                    className="w-full border p-3 rounded-lg" 
                    placeholder="e.g., 1000.5"
                    step="0.001"
                    min="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    NAV at Purchase
                  </label>
                  <input 
                    type="number" 
                    value={navAtPurchase} 
                    onChange={e => setNavAtPurchase(e.target.value)} 
                    className="w-full border p-3 rounded-lg" 
                    placeholder="e.g., 10,000"
                    step="0.01"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Net Asset Value per unit
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current NAV (optional)
                  </label>
                  <input 
                    type="number" 
                    value={currentNAV} 
                    onChange={e => setCurrentNAV(e.target.value)} 
                    className="w-full border p-3 rounded-lg" 
                    placeholder="Current value"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>
            </>
          )}

          {type === "deposito" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bank Name *
                </label>
                <input 
                  value={bankName} 
                  onChange={e => setBankName(e.target.value)} 
                  className="w-full border p-3 rounded-lg" 
                  placeholder="e.g., Bank ABC, Bank XYZ"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Principal Amount (IDR) *
                  </label>
                  <input 
                    type="number" 
                    value={principalAmount} 
                    onChange={e => setPrincipalAmount(e.target.value)} 
                    className="w-full border p-3 rounded-lg" 
                    placeholder="e.g., 50,000,000"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tenor *
                  </label>
                  <select 
                    value={tenor} 
                    onChange={e => setTenor(e.target.value)} 
                    className="w-full border p-3 rounded-lg"
                    required
                  >
                    <option value="">Select tenor</option>
                    <option value="1m">1 Month</option>
                    <option value="3m">3 Months</option>
                    <option value="6m">6 Months</option>
                    <option value="12m">12 Months</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Annual Interest Rate (%) *
                  </label>
                  <input 
                    type="number" 
                    value={interestRate} 
                    onChange={e => setInterestRate(e.target.value)} 
                    className="w-full border p-3 rounded-lg" 
                    placeholder="e.g., 5.25"
                    step="0.01"
                    min="0"
                    max="100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Interest Payment Type *
                  </label>
                  <select 
                    value={interestPaymentType} 
                    onChange={e => setInterestPaymentType(e.target.value)} 
                    className="w-full border p-3 rounded-lg"
                    required
                  >
                    <option value="maturity">Paid at Maturity</option>
                    <option value="monthly">Paid Monthly</option>
                    <option value="quarterly">Paid Quarterly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tax Rate (%) *
                  </label>
                  <input 
                    type="number" 
                    value={taxRate} 
                    onChange={e => setTaxRate(e.target.value)} 
                    className="w-full border p-3 rounded-lg" 
                    placeholder="e.g., 20"
                    step="0.01"
                    min="0"
                    max="100"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Default Indonesia: 20%
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Auto Rollover
                  </label>
                  <select 
                    value={autoRollover} 
                    onChange={e => setAutoRollover(e.target.value)} 
                    className="w-full border p-3 rounded-lg"
                  >
                    <option value="none">No Rollover</option>
                    <option value="principal">Rollover Principal</option>
                    <option value="principal-interest">Rollover Principal + Interest</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date *
                  </label>
                  <input 
                    type="date" 
                    value={startDate} 
                    onChange={e => setStartDate(e.target.value)} 
                    className="w-full border p-3 rounded-lg" 
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Maturity Date (auto)
                  </label>
                  <input 
                    type="text" 
                    value={maturityDate || "Select start date and tenor"} 
                    readOnly
                    className="w-full border p-3 rounded-lg bg-gray-50"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Auto-calculated based on start date + tenor
                  </p>
                </div>
              </div>
            </>
          )}

          {/* NOTES FIELD (for all types) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea 
              value={notes} 
              onChange={e => setNotes(e.target.value)} 
              className="w-full border p-3 rounded-lg" 
              placeholder="e.g., Dana darurat, dana pendidikan, investasi jangka panjang, promo bank"
              rows="2"
            />
            <p className="text-xs text-gray-500 mt-1">
              Add context or reminders about this investment
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}