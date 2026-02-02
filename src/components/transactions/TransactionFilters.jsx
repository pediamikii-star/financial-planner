import { accountStore } from "../../store/account.store";
import { useEffect, useState } from "react";

export default function TransactionFilter({ filter, onChange }) {
  const [accounts, setAccounts] = useState([]);

  useEffect(() => {
    accountStore.init();
    return accountStore.subscribe(setAccounts);
  }, []);

  return (
    <div className="flex flex-wrap gap-3 items-end">
      {/* PERIOD TYPE */}
      <select
        value={filter.periodType}
        onChange={(e) =>
          onChange({ ...filter, periodType: e.target.value })
        }
        className="bg-slate-800 p-2 rounded"
      >
        <option value="month">Month</option>
        <option value="year">Year</option>
      </select>

      {/* MONTH */}
      {filter.periodType === "month" && (
        <input
          type="month"
          value={filter.month}
          onChange={(e) =>
            onChange({ ...filter, month: e.target.value })
          }
          className="bg-slate-800 p-2 rounded"
        />
      )}

      {/* YEAR */}
      {filter.periodType === "year" && (
        <input
          type="number"
          placeholder="Year"
          value={filter.year}
          onChange={(e) =>
            onChange({ ...filter, year: e.target.value })
          }
          className="bg-slate-800 p-2 rounded w-24"
        />
      )}

      {/* TYPE */}
      <select
        value={filter.type}
        onChange={(e) =>
          onChange({ ...filter, type: e.target.value })
        }
        className="bg-slate-800 p-2 rounded"
      >
        <option value="">All Type</option>
        <option value="income">Income</option>
        <option value="expense">Expense</option>
        <option value="transfer">Transfer</option>
      </select>

      {/* ACCOUNT */}
      <select
        value={filter.accountId}
        onChange={(e) =>
          onChange({ ...filter, accountId: e.target.value })
        }
        className="bg-slate-800 p-2 rounded"
      >
        <option value="">All Account</option>
        {accounts.map((acc) => (
          <option key={acc.id} value={acc.id}>
            {acc.name}
          </option>
        ))}
      </select>
    </div>
  );
}
