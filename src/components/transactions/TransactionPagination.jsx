// components/transactions/TransactionPagination.jsx
export default function TransactionPagination({ 
  currentPage, 
  totalPages, 
  onPageChange 
}) {
  return (
    <div className="flex items-center justify-center gap-3 py-3 px-4 bg-white border-t border-slate-200">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        ← Previous
      </button>
      
      <div className="flex items-center gap-2">
        <span className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-cyan-400 text-white text-sm font-medium rounded-lg shadow-sm">
          Page {currentPage} of {totalPages}
        </span>
      </div>
      
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Next →
      </button>
    </div>
  );
}