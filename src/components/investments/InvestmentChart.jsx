import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { INVESTMENT_COLORS } from "../../utils/investmentUtils"; // TAMBAHKAN IMPORT

export default function InvestmentChart({ data = [] }) {
  if (data.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-400">
        No investment data
      </div>
    );
  }

  // HAPUS COLORS ARRAY LAMA
  // const COLORS = ["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#6B7280"];

  return (
    <div className="w-full h-full">
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            innerRadius={40}
            outerRadius={90}
            paddingAngle={4}
          >
            {data.map((entry) => (
              <Cell
                key={`cell-${entry.key}`}
                // GUNAKAN INVESTMENT_COLORS BERDASARKAN entry.key
                fill={INVESTMENT_COLORS[entry.key] || "#9CA3AF"}
              />
            ))}
          </Pie>

          <Tooltip
            formatter={(value) => `Rp ${value.toLocaleString("id-ID")}`}
            labelFormatter={(label) => label}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}