export default function TransactionHeader({ transactions }) {
  const total = transactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold">Transactions</h1>
        <p className="text-gray-400">Riwayat semua pemasukan & pengeluaran</p>
      </div>

      <div className="bg-emerald-900 rounded-xl px-6 py-4">
        <p className="text-sm text-gray-300">Total Movement</p>
        <p className="text-2xl font-bold text-emerald-400">
          Rp {total.toLocaleString("id-ID")}
        </p>
      </div>
    </div>
  );
}
