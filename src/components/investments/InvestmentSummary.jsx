export default function InvestmentSummary({ chartData = [] }) {
  const totalValue = chartData.reduce(
    (s, i) => s + Number(i.value || 0),
    0
  );

  return (
    <div className="bg-emerald-900 rounded-xl p-6 relative h-72">
      <p className="text-sm text-gray-300">
        Total Investment Value
      </p>

      <h2
        className="absolute inset-0 flex items-center justify-center
        text-4xl font-extrabold text-emerald-400"
      >
        Rp {totalValue.toLocaleString("id-ID")}
      </h2>
    </div>
  );
}
