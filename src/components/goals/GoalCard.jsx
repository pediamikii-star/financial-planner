// src/components/goals/GoalCard.jsx
import React, { useState } from "react";
import GoalProgress from "./GoalProgress";
import {
  calculateProgress,
  formatCurrency,
  isGoalCompleted,
  getCategoryIcon,
  getPriorityColor
} from "../../utils/goalUtils";

// Ikon untuk Edit (pencil)
const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
  </svg>
);

// Ikon untuk Delete (trash)
const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
  </svg>
);

const GoalCard = ({ goal, onEdit, onDelete, onAddFunds }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const progress = calculateProgress(
    goal.currentAmount,
    goal.targetAmount
  );

  const completed = isGoalCompleted(
    goal.currentAmount,
    goal.targetAmount
  );

  // Helper untuk display
  const categoryIcon = getCategoryIcon(goal.category);
  const priorityColor = getPriorityColor(goal.priority);

  // Handler untuk delete dengan inline confirmation
  const handleDelete = () => {
    if (showDeleteConfirm) {
      onDelete(goal.id);
      setShowDeleteConfirm(false);
    } else {
      setShowDeleteConfirm(true);
      // Auto hide setelah 3 detik
      setTimeout(() => {
        setShowDeleteConfirm(false);
      }, 3000);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 hover:bg-gray-50 transition shadow-sm relative group">
      {/* Header dengan Category & Priority */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-base text-gray-700">{categoryIcon}</span>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-gray-800 truncate">
              {goal.name}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-xs px-2 py-0.5 rounded-full ${priorityColor}`}>
                {goal.priority}
              </span>
              {goal.account && (
                <span className="text-xs text-gray-500 truncate">
                  💳 {goal.accountName}
                </span>
              )}
            </div>
          </div>
        </div>

        {completed ? (
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded whitespace-nowrap">
            ✓ Completed
          </span>
        ) : (
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded whitespace-nowrap">
            {progress}%
          </span>
        )}
      </div>

      {/* Deadline - lebih kecil */}
      {goal.deadline && (
        <p className="text-xs text-gray-600">
          Target: {new Date(goal.deadline).toLocaleDateString('id-ID')}
        </p>
      )}

      {/* Amount - lebih kompak */}
      <div className="text-xs space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Saved:</span>
          <span className="font-medium text-green-600">
            {formatCurrency(goal.currentAmount)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Target:</span>
          <span className="text-gray-700">{formatCurrency(goal.targetAmount)}</span>
        </div>
        <div className="flex justify-between items-center pt-1 border-t border-gray-100">
          <span className="text-gray-600">Remaining:</span>
          <span className="font-medium text-gray-800">
            {formatCurrency(goal.targetAmount - goal.currentAmount)}
          </span>
        </div>
      </div>

      {/* Progress Bar - lebih tipis */}
      <div className="pt-1">
        <GoalProgress percentage={progress} />
      </div>

      {/* Notes dan Tombol Action SEJAJAR */}
      <div className="flex items-center justify-between pt-2">
        {/* Notes - lebih kecil */}
        {goal.notes && (
          <p className="text-xs text-gray-500 italic truncate flex-1 mr-2">
            {goal.notes}
          </p>
        )}
        
        {/* Tombol Action - sejajar dengan notes */}
        <div className="flex gap-1 shrink-0">
          {/* Tombol Add Funds */}
          {!completed && onAddFunds && (
            <button
              onClick={() => onAddFunds(goal)}
              className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-2 py-1 rounded transition"
              disabled={showDeleteConfirm}
            >
              + Add
            </button>
          )}

          {/* Tombol Edit */}
          <button
            onClick={() => onEdit(goal)}
            className={`p-1.5 border rounded-lg transition ${
              showDeleteConfirm
                ? "text-gray-400 border-gray-200 bg-gray-50 cursor-not-allowed"
                : "text-gray-500 hover:text-blue-600 hover:bg-blue-50 border-gray-300 hover:border-blue-300"
            }`}
            title="Edit Goal"
            disabled={showDeleteConfirm}
          >
            <EditIcon />
          </button>

          {/* Tombol Delete */}
          <button
            onClick={handleDelete}
            className={`p-1.5 border rounded-lg transition ${
              showDeleteConfirm
                ? "bg-red-600 text-white border-red-700"
                : "text-red-600 hover:text-white hover:bg-red-600 border-red-300 hover:border-red-600"
            }`}
            title={showDeleteConfirm ? "Click again to confirm delete" : "Delete Goal"}
          >
            <TrashIcon />
          </button>
        </div>
      </div>

      {/* DELETE CONFIRMATION MESSAGE - di bawah */}
      {showDeleteConfirm && (
        <div className="mt-2 pt-2 border-t border-red-200">
          <div className="text-xs text-red-600 font-medium text-center">
            Click trash icon again to confirm delete
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalCard;