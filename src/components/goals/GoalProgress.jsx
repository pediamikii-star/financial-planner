// src/components/goals/GoalProgress.jsx
import React from "react";

const GoalProgress = ({ percentage }) => {
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs mb-1 text-gray-400">
        <span>Progress</span>
        <span>{percentage}%</span>
      </div>

      <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-500 transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default GoalProgress;
