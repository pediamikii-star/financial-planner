// src/components/goals/GoalsSummaryCards.jsx
import { useMemo } from "react";

export default function GoalsSummaryCards({ goals }) {
  const summary = useMemo(() => {
    return goals.reduce(
      (acc, g) => {
        acc.total += 1;
        if (g.currentAmount >= g.targetAmount) acc.completed += 1;
        else if (g.deadline && new Date(g.deadline) < new Date())
          acc.failed += 1;
        else acc.active += 1;

        return acc;
      },
      { total: 0, active: 0, completed: 0, failed: 0 }
    );
  }, [goals]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-emerald-900/40 rounded-xl p-5">
        <p className="text-sm text-emerald-300">Total Goals</p>
        <p className="text-2xl font-semibold text-emerald-400">
          {summary.total}
        </p>
      </div>

      <div className="bg-emerald-900/40 rounded-xl p-5">
        <p className="text-sm text-emerald-300">Active Goals</p>
        <p className="text-2xl font-semibold text-emerald-400">
          {summary.active}
        </p>
      </div>

      <div className="bg-emerald-900/40 rounded-xl p-5">
        <p className="text-sm text-emerald-300">Completed</p>
        <p className="text-2xl font-semibold text-emerald-400">
          {summary.completed}
        </p>
      </div>

      <div className="bg-emerald-900/40 rounded-xl p-5">
        <p className="text-sm text-emerald-300">Overdue / Failed</p>
        <p className="text-2xl font-semibold text-emerald-400">
          {summary.failed}
        </p>
      </div>
    </div>
  );
}
