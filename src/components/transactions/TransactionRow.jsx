import { getCategoryByKey } from "../../utils/transactionUtils";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

export default function TransactionRow({ data }) {
  const category = getCategoryByKey(data.category);
  const Icon = category?.icon;

  const isExpense = data.type === "expense";

  return (
    <div className="flex items-center justify-between px-4 py-3 hover:bg-slate-800">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center">
          {Icon && <Icon size={18} />}
        </div>

        <div>
          <p className="font-medium">{data.title}</p>
          <p className="text-xs text-gray-400">
            {data.account} • {data.date}
          </p>
        </div>
      </div>

      <div
        className={`flex items-center gap-1 font-semibold ${
          isExpense ? "text-red-400" : "text-emerald-400"
        }`}
      >
        {isExpense ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
        Rp {data.amount.toLocaleString("id-ID")}
      </div>
    </div>
  );
}
