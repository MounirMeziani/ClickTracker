export const BASKETBALL_GOALS = {
  shooting: {
    id: 1,
    name: "Free Throw Shooting",
    description: "Master your free throw technique and consistency",
    category: "shooting",
    maxLevel: 12
  },
  dribbling: {
    id: 2,
    name: "Ball Handling",
    description: "Improve your dribbling skills and ball control",
    category: "fundamentals",
    maxLevel: 12
  },
  defense: {
    id: 3,
    name: "Defensive Stance",
    description: "Perfect your defensive positioning and footwork",
    category: "defense",
    maxLevel: 12
  },
  conditioning: {
    id: 4,
    name: "Court Conditioning",
    description: "Build basketball-specific endurance and agility",
    category: "fitness",
    maxLevel: 12
  },
  threePoint: {
    id: 5,
    name: "3-Point Shooting",
    description: "Extend your range and improve 3-point accuracy",
    category: "shooting",
    maxLevel: 12
  },
  layups: {
    id: 6,
    name: "Layup Finishing",
    description: "Master finishing around the rim with both hands",
    category: "shooting",
    maxLevel: 12
  }
};

export const GOAL_CATEGORIES = {
  shooting: { name: "Shooting", color: "#f59e0b", icon: "🏀" },
  fundamentals: { name: "Fundamentals", color: "#3b82f6", icon: "⚡" },
  defense: { name: "Defense", color: "#ef4444", icon: "🛡️" },
  fitness: { name: "Fitness", color: "#10b981", icon: "💪" }
};

// Level decay system
export const LEVEL_DECAY_CONFIG = {
  pointsPerLevel: 100, // Points needed per level
  decayPerDay: 50, // Points lost per day of inactivity
  minimumWeeklyThreshold: 0.3, // 30% of weekly average
  minimumDailyThreshold: 0.3, // 30% of daily average
  gracePerioWeeks: 1 // 1 week grace period before decay starts
};

export function calculateLevelFromPoints(points: number): number {
  return Math.floor(points / LEVEL_DECAY_CONFIG.pointsPerLevel) + 1;
}

export function calculatePointsFromLevel(level: number): number {
  return (level - 1) * LEVEL_DECAY_CONFIG.pointsPerLevel;
}

export function calculateLevelDecay(
  lastActivityDate: string | null,
  currentPoints: number,
  weeklyAverage: number,
  dailyAverage: number
): { newPoints: number; daysInactive: number; pointsLost: number } {
  if (!lastActivityDate) {
    return { newPoints: currentPoints, daysInactive: 0, pointsLost: 0 };
  }

  const today = new Date();
  const lastActivity = new Date(lastActivityDate);
  const daysDiff = Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
  
  // Grace period before decay starts
  const graceDays = LEVEL_DECAY_CONFIG.gracePerioWeeks * 7;
  const daysInactive = Math.max(0, daysDiff - graceDays);
  
  if (daysInactive <= 0) {
    return { newPoints: currentPoints, daysInactive: 0, pointsLost: 0 };
  }

  const pointsLost = daysInactive * LEVEL_DECAY_CONFIG.decayPerDay;
  const newPoints = Math.max(0, currentPoints - pointsLost);
  
  return { newPoints, daysInactive, pointsLost };
}

export function calculateWeeklyTarget(weeklyAverage: number, dailyAverage: number): number {
  const weeklyThreshold = weeklyAverage * LEVEL_DECAY_CONFIG.minimumWeeklyThreshold;
  const dailyThreshold = dailyAverage * LEVEL_DECAY_CONFIG.minimumDailyThreshold * 7;
  
  return Math.max(weeklyThreshold, dailyThreshold);
}

export function checkActivityThreshold(
  weeklyClicks: number,
  weeklyTarget: number
): { metThreshold: boolean; percentage: number } {
  const percentage = weeklyTarget > 0 ? (weeklyClicks / weeklyTarget) * 100 : 100;
  const metThreshold = weeklyClicks >= weeklyTarget;
  
  return { metThreshold, percentage };
}

export function addPointsForActivity(currentPoints: number, clicks: number): number {
  // Award 1 point per click, with bonuses for consistency
  let pointsToAdd = clicks;
  
  // Bonus points for high activity days
  if (clicks >= 50) pointsToAdd += 10;
  if (clicks >= 100) pointsToAdd += 20;
  if (clicks >= 200) pointsToAdd += 50;
  
  return currentPoints + pointsToAdd;
}

export function getGoalProgressMessage(goal: any, oldLevel: number, newLevel: number): string {
  const goalName = BASKETBALL_GOALS[goal.category as keyof typeof BASKETBALL_GOALS]?.name || "Training";
  
  if (newLevel > oldLevel) {
    return `Level up! You've reached Level ${newLevel} in ${goalName}!`;
  }
  
  if (newLevel < oldLevel) {
    return `Due to inactivity, your ${goalName} level decreased to Level ${newLevel}. Get back to training!`;
  }
  
  return `Great work on your ${goalName} training! Keep it up!`;
}