// src/components/transactions/TransactionCharts.jsx
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { useMemo } from "react";

const COLORS = ["#34d399", "#60a5fa", "#a78bfa", "#facc15", "#fb7185"];

function buildChartData(transactions, type) {
  const map = {};

  transactions
    .filter((t) => t.type === type)
    .forEach((t) => {
      const key = t.category || "Others";
      map[key] = (map[key] || 0) + t.amount;
    });

  return Object.entries(map).map(([name, value]) => ({
    name,
    value,
  }));
}

export default function TransactionCharts({ transactions }) {
  const incomeData = useMemo(
    () => buildChartData(transactions, "income"),
    [transactions]
  );
  const expenseData = useMemo(
    () => buildChartData(transactions, "expense"),
    [transactions]
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* INCOME CHART */}
      <div className="bg-slate-900/60 rounded-xl p-5">
        <p className="mb-4 text-sm text-slate-300">Income Breakdown</p>
        <div className="h-64">
          <ResponsiveContainer>
            <PieChart>
              <Pie 
                data={incomeData} 
                dataKey="value" 
                innerRadius={40}
                outerRadius={90}
              >
                {incomeData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => `Rp ${value.toLocaleString("id-ID")}`}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* EXPENSE CHART */}
      <div className="bg-slate-900/60 rounded-xl p-5">
        <p className="mb-4 text-sm text-slate-300">Expense Breakdown</p>
        <div className="h-64">
          <ResponsiveContainer>
            <PieChart>
              <Pie 
                data={expenseData} 
                dataKey="value" 
                innerRadius={40}
                outerRadius={90}
              >
                {expenseData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => `Rp ${value.toLocaleString("id-ID")}`}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}