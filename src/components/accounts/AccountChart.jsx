import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

export default function AccountChart({
  cash = 0,
  bank = 0,
  digitalbank = 0,
  ewallet = 0,
  loan = 0,
}) {
  const data = [
    { name: "Cash", key: "cash", value: cash },
    { name: "Bank", key: "bank", value: bank },
    { name: "Digital Bank", key: "digitalbank", value: digitalbank },
    { name: "E-Wallet", key: "ewallet", value: ewallet },
    { name: "Loans", key: "loan", value: loan },
  ].filter(item => item.value > 0);

  if (data.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-400">
        No data
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <ResponsiveContainer>
        <PieChart>
          {/* GRADIENTS LEBIH KUAT - KONTRASTING */}
          <defs>
            {/* Bank - Deep Navy → Bright Blue */}
            <linearGradient id="bankGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#0033CC" /> {/* Darker */}
              <stop offset="100%" stopColor="#0A5FFF" /> {/* Brighter */}
            </linearGradient>

            {/* Digital Bank - Deep Teal → Bright Cyan */}
            <linearGradient id="digitalbankGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#0D9488" /> {/* Dark Teal */}
              <stop offset="100%" stopColor="#2DD4BF" /> {/* Bright Cyan */}
            </linearGradient>

            {/* E-Wallet - Forest Green → Lime Green */}
            <linearGradient id="ewalletGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#15803D" /> {/* Dark Green */}
              <stop offset="100%" stopColor="#4ADE80" /> {/* Lime Green */}
            </linearGradient>

            {/* Cash - Royal Blue → Sky Blue */}
            <linearGradient id="cashGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#1D4ED8" /> {/* Royal Blue */}
              <stop offset="100%" stopColor="#60A5FA" /> {/* Sky Blue */}
            </linearGradient>

            {/* Loans - Navy → Blue */}
            <linearGradient id="loanGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#1E3A8A" /> {/* Navy */}
              <stop offset="100%" stopColor="#3B82F6" /> {/* Blue */}
            </linearGradient>
          </defs>

          <Pie
            data={data}
            dataKey="value"
            innerRadius={60}
            outerRadius={130}
            nameKey="label"
            cx="50%"
            cy="50%"
            stroke="white"
            strokeWidth={1}
            animationDuration={2000}
            animationBegin={0}
            paddingAngle={0}
          >
            {data.map((item) => (
              <Cell
                key={item.key}
                fill={`url(#${item.key}Grad)`}
                stroke="#ffffff"
                strokeWidth={3} /* Stroke lebih tebal */
                strokeOpacity={1}
              />
            ))}
          </Pie>

          <Tooltip 
            formatter={(v) => `Rp ${v.toLocaleString("id-ID")}`}
            contentStyle={{
              background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '10px',
              fontWeight: '500'
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}