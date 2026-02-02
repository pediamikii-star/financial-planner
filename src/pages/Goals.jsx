import { useState, useEffect } from "react";
import { ChevronDown, Filter, SortAsc } from "lucide-react";
import GoalCard from "../components/goals/GoalCard";
import AddGoalModal from "../components/goals/AddGoalModal";
import useGoalStore from "../stores/goal.store";
import { 
  calculateProgress, 
  getGoalStatus,
  getBestPerformer,
  getNeedsAttention,
  getNextDeadline,
  calculateAverageMonthsLeft,
  calculateMonthlyNeed,
  formatDeadline,
  getCategoryIcon,
  formatCurrency,
  getCategoryLabel
} from "../utils/goalUtils";

/* ======================
   SORT & FILTER COMPONENTS (UPDATE STYLE)
====================== */
function SortDropdown({ sortBy, setSortBy, isOpen, setIsOpen }) {
  const sortOptions = [
    { id: "target-high", label: "Target: High to Low" },
    { id: "target-low", label: "Target: Low to High" },
    { id: "progress-high", label: "Progress: High to Low" },
    { id: "progress-low", label: "Progress: Low to High" },
    { id: "deadline-near", label: "Deadline: Nearest First" },
    { id: "deadline-far", label: "Deadline: Farthest First" },
    { id: "name-asc", label: "Name: A to Z" },
    { id: "name-desc", label: "Name: Z to A" },
    { id: "date-new", label: "Date: Newest First" },
    { id: "date-old", label: "Date: Oldest First" },
  ];

  const currentLabel = sortOptions.find(opt => opt.id === sortBy)?.label || "Sort by";

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-xs font-medium text-slate-700 hover:text-slate-900 px-4 py-2.5 border border-slate-300 hover:border-slate-400 rounded-xl transition-all bg-white hover:bg-slate-50 shadow-sm hover:shadow"
      >
        <SortAsc size={16} className="text-slate-500" />
        {currentLabel}
        <ChevronDown size={16} className={`transition-transform ${isOpen ? "rotate-180" : ""} text-slate-500`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden">
          {sortOptions.map(option => (
            <button
              key={option.id}
              onClick={() => {
                setSortBy(option.id);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-3 text-sm hover:bg-gradient-to-r hover:from-slate-50/80 hover:to-white transition-all ${
                sortBy === option.id 
                  ? "bg-gradient-to-r from-blue-50/80 to-blue-50/30 text-blue-600 font-medium border-l-4 border-blue-500" 
                  : "text-slate-700"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterDropdown({ filterStatus, setFilterStatus, filterCategory, setFilterCategory, isOpen, setIsOpen }) {
  const statusOptions = [
    { id: "all", label: "All Status" },
    { id: "completed", label: "Completed" },
    { id: "in-progress", label: "In Progress" },
    { id: "not-started", label: "Not Started" },
  ];

  const categoryOptions = [
    { id: "all", label: "All Categories" },
    { id: "vacation", label: "Vacation" },
    { id: "vehicle", label: "Vehicle" },
    { id: "education", label: "Education" },
    { id: "property", label: "Property" },
    { id: "wedding", label: "Wedding" },
    { id: "emergency", label: "Emergency Fund" },
    { id: "other", label: "Other" },
  ];

  const currentStatusLabel = statusOptions.find(opt => opt.id === filterStatus)?.label || "Status";
  const currentCategoryLabel = categoryOptions.find(opt => opt.id === filterCategory)?.label || "Category";

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-xs font-medium text-slate-700 hover:text-slate-900 px-4 py-2.5 border border-slate-300 hover:border-slate-400 rounded-xl transition-all bg-white hover:bg-slate-50 shadow-sm hover:shadow"
      >
        <Filter size={16} className="text-slate-500" />
        Filter
        <ChevronDown size={16} className={`transition-transform ${isOpen ? "rotate-180" : ""} text-slate-500`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 max-h-80 overflow-y-auto p-5">
          {/* Status Filter */}
          <div className="mb-5">
            <h4 className="text-xs font-semibold text-slate-700 mb-3 uppercase tracking-wide">Status</h4>
            <div className="space-y-1">
              {statusOptions.map(option => (
                <button
                  key={option.id}
                  onClick={() => {
                    setFilterStatus(option.id);
                    if (option.id !== "all") setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm rounded-xl hover:bg-gradient-to-r hover:from-slate-50/80 hover:to-white transition-all ${
                    filterStatus === option.id 
                      ? "bg-gradient-to-r from-emerald-50/80 to-emerald-50/30 text-emerald-600 font-medium border-l-4 border-emerald-500" 
                      : "text-slate-700"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <h4 className="text-xs font-semibold text-slate-700 mb-3 uppercase tracking-wide">Category</h4>
            <div className="space-y-1">
              {categoryOptions.map(option => (
                <button
                  key={option.id}
                  onClick={() => {
                    setFilterCategory(option.id);
                    if (option.id !== "all") setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm rounded-xl hover:bg-gradient-to-r hover:from-slate-50/80 hover:to-white transition-all ${
                    filterCategory === option.id 
                      ? "bg-gradient-to-r from-emerald-50/80 to-emerald-50/30 text-emerald-600 font-medium border-l-4 border-emerald-500" 
                      : "text-slate-700"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Clear All Button */}
          <div className="mt-5 pt-5 border-t border-slate-200">
            <button
              onClick={() => {
                setFilterStatus("all");
                setFilterCategory("all");
                setIsOpen(false);
              }}
              className="w-full text-center px-4 py-3 text-sm font-medium text-blue-600 hover:bg-blue-50/80 rounded-xl border border-blue-200 hover:border-blue-300 transition-all"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ======================
   METRIC ITEM (DARI ACCOUNTS)
====================== */
function MetricItem({ icon, label, value, trend }) {
  const trendColor = trend?.startsWith('+') ? 'text-emerald-600' : trend?.startsWith('-') ? 'text-rose-600' : 'text-slate-600';
  
  return (
    <div className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-white/40 border border-white/60 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
          <span className="text-sm">{icon}</span>
        </div>
        <div>
          <span className="text-xs text-slate-600 font-medium">{label}</span>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-slate-800">{value}</span>
            {trend && (
              <span className={`text-xs font-medium ${trendColor}`}>{trend}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Goals() {
  const { goals, deleteGoal } = useGoalStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);

  // State untuk Sort & Filter
  const [sortBy, setSortBy] = useState("deadline-near");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortOpen, setSortOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  /* ======================
     FILTERING FUNCTION
  ====================== */
  const filteredGoals = goals.filter(goal => {
    // Filter by status
    const status = getGoalStatus(goal.currentAmount, goal.targetAmount);
    const statusMatch = filterStatus === "all" || status === filterStatus;
    
    // Filter by category
    const categoryMatch = filterCategory === "all" || goal.category === filterCategory;
    
    return statusMatch && categoryMatch;
  });

  /* ======================
     SORTING FUNCTION
  ====================== */
  const sortedGoals = [...filteredGoals].sort((a, b) => {
    switch(sortBy) {
      case "target-high":
        return (b.targetAmount || 0) - (a.targetAmount || 0);
      case "target-low":
        return (a.targetAmount || 0) - (b.targetAmount || 0);
      case "progress-high":
        return calculateProgress(b.currentAmount, b.targetAmount) - calculateProgress(a.currentAmount, a.targetAmount);
      case "progress-low":
        return calculateProgress(a.currentAmount, a.targetAmount) - calculateProgress(b.currentAmount, b.targetAmount);
      case "deadline-near":
        if (!a.deadline && !b.deadline) return 0;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline) - new Date(b.deadline);
      case "deadline-far":
        if (!a.deadline && !b.deadline) return 0;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(b.deadline) - new Date(a.deadline);
      case "name-asc":
        return (a.name || "").localeCompare(b.name || "");
      case "name-desc":
        return (b.name || "").localeCompare(a.name || "");
      case "date-new":
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      case "date-old":
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      default:
        return 0;
    }
  });

  /* ======================
     STATISTICS CALCULATION
  ====================== */
  const totalTarget = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const totalCurrent = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
  const progress = totalTarget === 0 ? 0 : Math.round((totalCurrent / totalTarget) * 100);

  // Status counts (from all goals, not filtered)
  const completedGoals = goals.filter(g => getGoalStatus(g.currentAmount, g.targetAmount) === "completed").length;
  const activeGoals = goals.filter(g => getGoalStatus(g.currentAmount, g.targetAmount) === "in-progress").length;
  const notStartedGoals = goals.filter(g => getGoalStatus(g.currentAmount, g.targetAmount) === "not-started").length;

  // Get insights (from all goals)
  const bestPerformer = getBestPerformer(goals);
  const needsAttention = getNeedsAttention(goals);
  const nextDeadlineGoal = getNextDeadline(goals);
  const avgMonthsLeft = calculateAverageMonthsLeft(goals);
  const monthlyNeed = calculateMonthlyNeed(goals);

  const handleDelete = (id) => {
    if (!confirm("Hapus goal ini?")) return;
    deleteGoal(id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Close dropdown saat klik di luar */}
      {(sortOpen || filterOpen) && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => {
            setSortOpen(false);
            setFilterOpen(false);
          }}
        />
      )}

      {/* ===== HEADER SECTION ===== */}
      <div className="z-30 pb-6">
        {/* ===== HEADER TITLE & BUTTON ===== */}
        <div className="flex items-center justify-between mb-6 pt-4">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Goals
            </h1>
            <p className="text-slate-500 text-sm font-medium mt-1">
              Target keuangan yang ingin kamu capai
            </p>
          </div>

          <button
            onClick={() => {
              setEditingGoal(null);
              setShowAddModal(true);
            }}
            className="group relative bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 px-6 py-2.5 rounded-lg text-sm font-semibold text-white transition-all shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"></div>
            <span className="relative flex items-center gap-2">
              <span className="text-base">+</span> Add New Goal
            </span>
          </button>
        </div>

        {/* ===== DUA CARD UTAMA - UKURAN FIX 480px ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.6fr] gap-5">
          
          {/* ===== CARD KIRI: GOALS OVERVIEW - UKURAN FIX 480px ===== */}
          <div className="relative bg-gradient-to-br from-blue-50 via-white to-blue-100/30 rounded-2xl p-6 shadow-lg border border-blue-200/50 
            h-[480px] min-h-[480px] max-h-[480px] overflow-hidden flex flex-col">
            
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-400/10 to-cyan-300/10 rounded-full -translate-y-12 translate-x-12"></div>
            
            <div className="relative z-10 flex-1 overflow-hidden flex flex-col">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-md">
                  <span className="text-xl text-white">🎯</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Goals Overview</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Your financial journey at a glance</p>
                </div>
              </div>

              <div className="mb-5 flex-1 overflow-hidden flex flex-col">
                <div className="text-center mb-6">
                  <div className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-2">
                    {progress}%
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-50 to-emerald-100/50 rounded-full mb-4">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                    <span className="text-xs font-medium text-emerald-700">
                      {goals.length} goals registered
                    </span>
                  </div>
                </div>

                {/* ===== METRICS GRID - DENGAN SCROLL JIKA PERLU ===== */}
                <div className="grid grid-cols-2 gap-3 h-[180px] overflow-y-auto pr-1">
                  <MetricItem 
                    icon="📊"
                    label="Total Target" 
                    value={`Rp ${totalTarget > 1000000 ? (totalTarget / 1000000).toFixed(1) + 'M' : (totalTarget / 1000).toFixed(0) + 'K'}`}
                  />
                  <MetricItem 
                    icon="💰"
                    label="Total Saved" 
                    value={`Rp ${totalCurrent > 1000000 ? (totalCurrent / 1000000).toFixed(1) + 'M' : (totalCurrent / 1000).toFixed(0) + 'K'}`}
                  />
                  <MetricItem 
                    icon="⏱️"
                    label="Avg Time Left" 
                    value={`${avgMonthsLeft}m`}
                  />
                  <MetricItem 
                    icon="📈"
                    label="Monthly Need" 
                    value={`Rp ${monthlyNeed > 1000000 ? (monthlyNeed / 1000000).toFixed(1) + 'M' : (monthlyNeed / 1000).toFixed(0) + 'K'}`}
                  />
                  {/* Tambahan metrics bisa ditambahkan di sini, card TETAP 480px */}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-200/50">
                <span className="text-xs text-slate-500">Updated just now</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                  <span className="text-xs font-medium text-slate-700">{activeGoals} active</span>
                </div>
              </div>
            </div>
          </div>

          {/* ===== CARD KANAN: PERFORMANCE TRACKER - UKURAN FIX 480px ===== */}
          <div className="relative bg-gradient-to-br from-emerald-50 via-white to-emerald-100/30 rounded-2xl p-6 shadow-lg border border-emerald-200/50 
            h-[480px] min-h-[480px] max-h-[480px] overflow-hidden">
            
            <div className="absolute bottom-0 right-0 w-28 h-28 bg-gradient-to-br from-emerald-300/10 to-teal-200/10 rounded-full translate-x-14 translate-y-14"></div>
            
            <div className="relative z-10 h-full flex flex-col">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-400 rounded-xl flex items-center justify-center shadow-md">
                  <span className="text-xl text-white">🚀</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Performance Tracker</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Insights & recommendations</p>
                </div>
              </div>

              {/* ===== CONTENT AREA - TINGGI FIX TANPA SCROLL ===== */}
              <div className="flex-1">
                <div className="space-y-4">
                  {/* Best Performer */}
                  <div className="bg-white/50 rounded-xl p-4 border border-slate-200/50 shadow-inner">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-amber-500 to-orange-400 rounded-lg flex items-center justify-center">
                          <span className="text-sm text-white">🔥</span>
                        </div>
                        <span className="text-sm font-semibold text-slate-800">Best Performer</span>
                      </div>
                    </div>
                    {bestPerformer ? (
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getCategoryIcon(bestPerformer.category)}</span>
                            <span className="font-medium text-slate-900 truncate max-w-[120px]">
                              {bestPerformer.name || 'Unnamed Goal'}
                            </span>
                          </div>
                          <div className="text-xs text-emerald-600 mt-1">
                            {calculateProgress(bestPerformer.currentAmount, bestPerformer.targetAmount)}% achieved
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-slate-900">
                            Rp {bestPerformer.currentAmount > 1000000 ? (bestPerformer.currentAmount / 1000000).toFixed(1) + 'M' : (bestPerformer.currentAmount / 1000).toFixed(0) + 'K'}
                          </div>
                          <div className="text-xs text-slate-500">
                            of {bestPerformer.targetAmount > 1000000 ? (bestPerformer.targetAmount / 1000000).toFixed(1) + 'M' : (bestPerformer.targetAmount / 1000).toFixed(0) + 'K'}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-2 text-slate-400 text-sm">No data</div>
                    )}
                  </div>

                  {/* Needs Attention */}
                  <div className="bg-white/50 rounded-xl p-4 border border-slate-200/50 shadow-inner">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-rose-500 to-pink-400 rounded-lg flex items-center justify-center">
                          <span className="text-sm text-white">⚠️</span>
                        </div>
                        <span className="text-sm font-semibold text-slate-800">Needs Attention</span>
                      </div>
                    </div>
                    {needsAttention ? (
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getCategoryIcon(needsAttention.category)}</span>
                            <span className="font-medium text-slate-900 truncate max-w-[120px]">
                              {needsAttention.name}
                            </span>
                          </div>
                          <div className="text-xs text-rose-600 mt-1">
                            {needsAttention.deadline ? formatDeadline(needsAttention.deadline) : "No deadline"}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-slate-900">
                            {calculateProgress(needsAttention.currentAmount, needsAttention.targetAmount)}%
                          </div>
                          <div className="text-xs text-slate-500">
                            Progress
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-2 text-emerald-400 text-sm">All on track</div>
                    )}
                  </div>

                  {/* Next Deadline & Status */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/50 rounded-xl p-4 border border-slate-200/50 shadow-inner">
                      <div className="text-xs font-semibold text-slate-700 mb-2">📅 Next Deadline</div>
                      <div className="text-sm font-bold text-slate-900 truncate">
                        {nextDeadlineGoal 
                          ? formatDeadline(nextDeadlineGoal.deadline)
                          : "None"
                        }
                      </div>
                      {nextDeadlineGoal && (
                        <div className="text-xs text-slate-500 mt-1 truncate">
                          {nextDeadlineGoal.name}
                        </div>
                      )}
                    </div>
                    
                    <div className="bg-white/50 rounded-xl p-4 border border-slate-200/50 shadow-inner">
                      <div className="text-xs font-semibold text-slate-700 mb-2">📊 Status</div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-bold text-slate-900">{activeGoals}</div>
                          <div className="text-xs text-slate-500">Active</div>
                        </div>
                        <div className="h-6 w-px bg-slate-300"></div>
                        <div>
                          <div className="text-sm font-bold text-slate-900">{completedGoals}</div>
                          <div className="text-xs text-slate-500">Completed</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== CONTENT BELOW ===== */}
      <div className="pt-6">
        {/* ===== SECTION TITLE & ACTIVE FILTER/SORT ===== */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-cyan-400 rounded-full"></div>
              <h2 className="text-xl font-bold text-slate-800">My Goals</h2>
            </div>
            <p className="text-slate-600 text-sm font-medium mt-1 ml-5">
              {sortedGoals.length} goal{sortedGoals.length !== 1 ? 's' : ''} registered
              {(filterStatus !== "all" || filterCategory !== "all") && (
                <span className="text-blue-600 font-semibold ml-2">
                  (Filtered: {
                    filterStatus !== "all" && filterCategory !== "all" 
                      ? `${filterStatus} & ${filterCategory}`
                      : filterStatus !== "all" 
                        ? filterStatus 
                        : filterCategory
                  })
                </span>
              )}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <SortDropdown 
              sortBy={sortBy}
              setSortBy={setSortBy}
              isOpen={sortOpen}
              setIsOpen={setSortOpen}
            />
            
            <FilterDropdown 
              filterStatus={filterStatus}
              setFilterStatus={setFilterStatus}
              filterCategory={filterCategory}
              setFilterCategory={setFilterCategory}
              isOpen={filterOpen}
              setIsOpen={setFilterOpen}
            />
          </div>
        </div>

        {/* ===== GOALS LIST - GRID 4 KOLOM ===== */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {sortedGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={() => {
                setEditingGoal(goal);
                setShowAddModal(true);
              }}
              onDelete={() => handleDelete(goal.id)}
            />
          ))}
        </div>

        {/* Empty State */}
        {sortedGoals.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-slate-300 rounded-2xl mt-8 bg-gradient-to-b from-white to-slate-50/50">
            <div className="text-6xl mb-4 text-slate-300">🎯</div>
            <h3 className="text-xl font-bold mb-3 text-slate-800">
              {goals.length === 0 ? "No Goals Yet" : "No Goals Match Your Filter"}
            </h3>
            <p className="text-slate-600 mb-6 max-w-md mx-auto">
              {goals.length === 0 
                ? "Start your financial journey by creating your first goal" 
                : "Try adjusting your filter settings to see more results"}
            </p>
            <button
              onClick={() => {
                if (goals.length === 0) {
                  setShowAddModal(true);
                } else {
                  setFilterStatus("all");
                  setFilterCategory("all");
                }
              }}
              className="group bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 px-6 py-3 rounded-lg font-semibold text-white transition-all shadow-md hover:shadow-lg hover:scale-[1.02]"
            >
              {goals.length === 0 ? "Create First Goal" : "Clear All Filters"}
            </button>
          </div>
        )}

        {/* Footer */}
        {sortedGoals.length > 0 && (
          <div className="mt-8 pt-6 border-t border-slate-300/50">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="px-3 py-1.5 bg-gradient-to-r from-slate-100 to-white rounded-lg">
                  <span className="font-bold text-slate-900">{sortedGoals.length}</span>
                  <span className="text-slate-600 ml-1">
                    goal{sortedGoals.length !== 1 ? 's' : ''} total
                  </span>
                  {(filterStatus !== "all" || filterCategory !== "all") && (
                    <span className="ml-3 px-2 py-1 bg-gradient-to-r from-blue-100 to-blue-50 text-blue-600 font-semibold text-xs rounded-md">
                      Filtered: {
                        filterStatus !== "all" && filterCategory !== "all" 
                          ? `${filterStatus} & ${filterCategory}`
                          : filterStatus !== "all" 
                            ? filterStatus 
                            : filterCategory
                      }
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-full shadow-sm"></div>
                  <span className="text-slate-700 text-sm font-medium">Active: {activeGoals}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 bg-gradient-to-br from-emerald-500 to-teal-400 rounded-full shadow-sm"></div>
                  <span className="text-slate-700 text-sm font-medium">Completed: {completedGoals}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 bg-gradient-to-br from-slate-400 to-slate-300 rounded-full shadow-sm"></div>
                  <span className="text-slate-700 text-sm font-medium">Not Started: {notStartedGoals}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL */}
        {showAddModal && (
          <AddGoalModal
            editingGoal={editingGoal}
            onClose={() => {
              setShowAddModal(false);
              setEditingGoal(null);
            }}
          />
        )}
      </div>
    </div>
  );
}