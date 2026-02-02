// src/components/creators/CreatorChart.jsx - FULL FIXED VERSION
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const PLATFORM_GRADIENTS = {
  youtube: ["#FF0000", "#FF8A8A"],      // red → soft red
  tiktok: ["#000000", "#25F4EE"],       // black → cyan
  instagram: ["#833AB4", "#FD1D1D"],    // purple → red
  twitter: ["#0F172A", "#94A3B8"],      // dark gray → light gray
  facebook: ["#1877F2", "#6CA9FF"],     // blue → light blue
  blog: ["#F57C00", "#FFB74D"],         // orange → soft orange
  fiverr: ["#1DBF73", "#7AE6B8"],       // green → mint
  upwork: ["#14A800", "#7ED957"],       // green → lime
  shopee: ["#EE4D2D", "#FF9F8A"],       // orange → peach
  lynkid: ["#0F172A", "#64748B"],       // dark navy → slate
  other: ["#94A3B8", "#CBD5E1"],        // gray → light gray
};

// Helper untuk format platform name
const formatPlatformName = (key) => {
  const map = {
    youtube: "YouTube",
    tiktok: "TikTok",
    instagram: "Instagram",
    twitter: "Twitter / X",
    facebook: "Facebook",
    blog: "Blog / Website",
    fiverr: "Fiverr",
    upwork: "Upwork",
    shopee: "Shopee",
    lynkid: "Lynkid",
    other: "Other Platforms"
  };
  return map[key] || key;
};

// Generate gradient ID
const getGradientId = (platform) => `gradient-${platform}`;

// Create gradient definitions
const GradientDefinitions = ({ data }) => {
  return (
    <defs>
      {data.map((item) => {
        const platform = (item.key || 'other').toLowerCase();
        const colors = PLATFORM_GRADIENTS[platform] || PLATFORM_GRADIENTS.other;
        const gradientId = getGradientId(platform);
        
        return (
          <linearGradient
            key={gradientId}
            id={gradientId}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor={colors[0]} />
            <stop offset="100%" stopColor={colors[1]} />
          </linearGradient>
        );
      })}
    </defs>
  );
};

// Custom Tooltip Component
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const platformName = data.label || formatPlatformName(data.key);
    
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-bold text-gray-800 text-sm mb-1">{platformName}</p>
        <p className="text-gray-600 font-semibold">
          Rp {Number(data.value).toLocaleString("id-ID")}
        </p>
      </div>
    );
  }
  return null;
};

// Main Component
export default function CreatorChart({ data = [] }) {
  // Debug
  console.log("📊 CHART DATA:", data);

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-white rounded-xl">
        <div className="text-center">
          <div className="text-4xl mb-2">📊</div>
          <div className="text-gray-500 text-sm">No data available</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          {/* Render gradient definitions */}
          <GradientDefinitions data={data} />

          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={130}
            paddingAngle={0}
            stroke="white"
            strokeWidth={1}
            animationDuration={2000}
            animationBegin={0}
          >
            {data.map((entry, index) => {
              const platform = (entry.key || 'other').toLowerCase();
              const gradientId = getGradientId(platform);
              const colors = PLATFORM_GRADIENTS[platform] || PLATFORM_GRADIENTS.other;
              
              console.log(`🎯 Platform: ${platform}, Label: ${entry.label}`);
              
              return (
                <Cell
                  key={`cell-${index}`}
                  fill={`url(#${gradientId})`}
                  stroke="#ffffff"
                  strokeWidth={1}
                  style={{
                    filter: `drop-shadow(0px 2px 4px ${colors[0]}30)`,
                  }}
                />
              );
            })}
          </Pie>

          {/* PAKAI CUSTOM TOOLTIP */}
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}