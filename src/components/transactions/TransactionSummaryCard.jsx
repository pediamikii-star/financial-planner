// src/components/transactions/TransactionSummaryCards.jsx
import { useMemo } from "react";

export default function TransactionSummaryCards({ transactions }) {
  const { income, expense } = useMemo(() => {
    return transactions.reduce(
      (acc, t) => {
        if (t.type === "income") acc.income += t.amount;
        if (t.type === "expense") acc.expense += t.amount;
        return acc;
      },
      { income: 0, expense: 0 }
    );
  }, [transactions]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* INCOME */}
      <div className="bg-emerald-900/40 rounded-xl p-5">
        <p className="text-sm text-emerald-300">Total Income</p>
        <p className="text-2xl font-semibold text-emerald-400">
          Rp {income.toLocaleString("id-ID")}
        </p>
      </div>

      {/* EXPENSE */}
      <div className="bg-rose-900/40 rounded-xl p-5">
        <p className="text-sm text-rose-300">Total Expense</p>
        <p className="text-2xl font-semibold text-rose-400">
          Rp {expense.toLocaleString("id-ID")}
        </p>
      </div>
    </div>
  );
}
