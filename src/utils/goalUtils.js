// src/utils/goalUtils.js

// Progress calculation
export const calculateProgress = (current, target) => {
  if (!target || target === 0) return 0;
  return Math.min(Math.round((current / target) * 100), 100);
};

export const isGoalCompleted = (current, target) => {
  return current >= target;
};

export const getGoalStatus = (current, target) => {
  if (current >= target) return "completed";
  if (current > 0) return "in-progress";
  return "not-started";
};

// NEW: Get goal with highest progress
export const getBestPerformer = (goals) => {
  if (!goals.length) return null;
  
  return goals.reduce((best, goal) => {
    const bestProgress = calculateProgress(best.currentAmount, best.targetAmount);
    const currentProgress = calculateProgress(goal.currentAmount, goal.targetAmount);
    return currentProgress > bestProgress ? goal : best;
  });
};

// NEW: Get goal with lowest progress (but not completed)
export const getNeedsAttention = (goals) => {
  if (!goals.length) return null;
  
  const incompleteGoals = goals.filter(g => !isGoalCompleted(g.currentAmount, g.targetAmount));
  if (!incompleteGoals.length) return null;
  
  return incompleteGoals.reduce((lowest, goal) => {
    const lowestProgress = calculateProgress(lowest.currentAmount, lowest.targetAmount);
    const currentProgress = calculateProgress(goal.currentAmount, goal.targetAmount);
    return currentProgress < lowestProgress ? goal : lowest;
  });
};

// NEW: Get next deadline
export const getNextDeadline = (goals) => {
  const now = new Date();
  const futureGoals = goals
    .filter(g => g.deadline && new Date(g.deadline) > now)
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  
  return futureGoals[0] || null;
};

// NEW: Calculate average months left
export const calculateAverageMonthsLeft = (goals) => {
  const now = new Date();
  const validGoals = goals.filter(g => g.deadline);
  
  if (!validGoals.length) return 0;
  
  const totalMonths = validGoals.reduce((sum, goal) => {
    const deadline = new Date(goal.deadline);
    const monthsLeft = Math.max(
      (deadline.getFullYear() - now.getFullYear()) * 12 + 
      (deadline.getMonth() - now.getMonth()),
      1
    );
    return sum + monthsLeft;
  }, 0);
  
  return Math.round(totalMonths / validGoals.length);
};

// NEW: Calculate monthly need to reach all goals
export const calculateMonthlyNeed = (goals) => {
  const now = new Date();
  let totalRemaining = 0;
  let totalWeightedMonths = 0;
  
  goals.forEach(goal => {
    if (!goal.deadline) return;
    
    const remaining = goal.targetAmount - goal.currentAmount;
    if (remaining <= 0) return;
    
    const deadline = new Date(goal.deadline);
    const monthsLeft = Math.max(
      (deadline.getFullYear() - now.getFullYear()) * 12 + 
      (deadline.getMonth() - now.getMonth()),
      1
    );
    
    totalRemaining += remaining;
    totalWeightedMonths += monthsLeft;
  });
  
  if (totalWeightedMonths === 0) return 0;
  return Math.ceil(totalRemaining / totalWeightedMonths);
};

// NEW: Format date nicely
export const formatDeadline = (dateString) => {
  if (!dateString) return "No deadline";
  
  const date = new Date(dateString);
  const now = new Date();
  const daysLeft = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
  
  if (daysLeft < 0) return "Overdue!";
  if (daysLeft === 0) return "Today!";
  if (daysLeft === 1) return "Tomorrow";
  if (daysLeft < 30) return `${daysLeft} days left`;
  
  const monthsLeft = Math.floor(daysLeft / 30);
  return `${monthsLeft} month${monthsLeft > 1 ? 's' : ''} left`;
};

// Formatting
export const formatCurrency = (value) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);
};

export const formatDate = (dateString) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

// Category & Priority helpers
export const getCategoryIcon = (category) => {
  const icons = {
    wedding: "💍",
    house: "🏠",
    vehicle: "🚗",
    travel: "✈️",
    gadget: "💻",
    emergency: "🏥",
    education: "🎓",
    family: "👶",
    investment: "📈",
    lifestyle: "🛒",
    other: "🎯"
  };
  return icons[category] || "🎯";
};

export const getCategoryLabel = (category) => {
  const labels = {
    wedding: "Wedding & Marriage",
    house: "House & Property",
    vehicle: "Vehicle",
    travel: "Travel",
    gadget: "Gadget & Tech",
    emergency: "Emergency Fund",
    education: "Education",
    family: "Family & Children",
    investment: "Investment",
    lifestyle: "Lifestyle",
    other: "Other"
  };
  return labels[category] || "Other";
};

export const getPriorityColor = (priority) => {
  const colors = {
    high: "bg-red-500/20 text-red-300",
    medium: "bg-yellow-500/20 text-yellow-300",
    low: "bg-blue-500/20 text-blue-300"
  };
  return colors[priority] || "bg-gray-500/20 text-gray-300";
};

// Calculation helpers
export const calculateDaysLeft = (deadline) => {
  if (!deadline) return null;
  
  const now = new Date();
  const endDate = new Date(deadline);
  const diffTime = endDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};