import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

export default function AssetChart({ data = [] }) {
  if (data.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-400">
        No asset data
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <ResponsiveContainer>
        <PieChart>
          {/* GRADIENTS EARTH TONES / WARM NEUTRALS */}
          <defs>
            {/* Property - Peach */}
            <linearGradient id="propertyGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#E6B89C" /> {/* Peach soft */}
              <stop offset="100%" stopColor="#F8D5B9" /> {/* Peach cream */}
            </linearGradient>

            {/* Vehicle - Taupe */}
            <linearGradient id="vehicleGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#B8B0A2" /> {/* Taupe medium */}
              <stop offset="100%" stopColor="#D4CFC7" /> {/* Taupe light */}
            </linearGradient>

            {/* Gold - Gold/Yellow (FOCAL POINT) */}
            <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#F0C14B" /> {/* Gold medium */}
              <stop offset="100%" stopColor="#FFD97D" /> {/* Gold light */}
            </linearGradient>

            {/* Land - Terracotta */}
            <linearGradient id="landGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#D4A574" /> {/* Terracotta */}
              <stop offset="100%" stopColor="#E6C9A8" /> {/* Terracotta light */}
            </linearGradient>

            {/* Gadget - Warm Gray */}
            <linearGradient id="gadgetGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#A89F95" /> {/* Gray warm */}
              <stop offset="100%" stopColor="#C7BFB5" /> {/* Gray warm light */}
            </linearGradient>

            {/* Other - Neutral Cream */}
            <linearGradient id="otherGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#D1C7B7" /> {/* Cream */}
              <stop offset="100%" stopColor="#E8E2D9" /> {/* Cream light */}
            </linearGradient>
          </defs>

          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            innerRadius={60}
            outerRadius={130}
            paddingAngle={0}
            cx="50%"
            cy="50%"
            stroke="white"
            strokeWidth={1}
            animationDuration={2000}
            animationBegin={0}
          >
            {data.map((item) => (
              <Cell
                key={item.key}
                fill={`url(#${item.key}Grad)`}
                stroke="#ffffff"
                strokeWidth={3}
                strokeOpacity={1}
              />
            ))}
          </Pie>

          <Tooltip 
            formatter={(value) => `Rp ${value.toLocaleString("id-ID")}`}
            labelFormatter={(label) => label}
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