// Basketball career progression system
/**
 * BASKETBALL GAMIFICATION SYSTEM
 * 
 * This module defines the basketball-themed progression system that gamifies
 * productivity tracking through familiar sports metaphors and achievements.
 * 
 * KEY CONCEPTS:
 * - Career progression from Rookie to Hall of Famer (12 levels)
 * - Uniform unlocks (skins) tied to level progression
 * - Achievement system for milestones and streaks
 * - Dynamic daily challenges based on user level
 * 
 * DESIGN PHILOSOPHY:
 * - Progressive difficulty scaling to maintain engagement
 * - Basketball terminology for relatability and fun
 * - Multiple reward types (levels, skins, achievements)
 * - Adaptive challenges that grow with user capability
 */

/**
 * CAREER LEVEL PROGRESSION SYSTEM
 * Defines the 12-level basketball career progression with exponential difficulty scaling.
 * Each level represents a milestone in the user's productivity journey.
 */
export const CAREER_LEVELS = {
  1: { name: "Job Application Level", title: "Playground Beginner", clicksRequired: 0, description: "Just starting your job search journey" },
  2: { name: "Job Application Level", title: "Junior Varsity Applicant", clicksRequired: 50, description: "Building your application skills" },
  3: { name: "Job Application Level", title: "Varsity Job Hunter", clicksRequired: 100, description: "Consistently applying to opportunities" },
  4: { name: "Job Application Level", title: "College Recruit Level", clicksRequired: 250, description: "Targeting quality positions" },
  5: { name: "Job Application Level", title: "Division 1 Candidate", clicksRequired: 400, description: "Competing for top-tier roles" },
  6: { name: "Job Application Level", title: "Draft Prospect Status", clicksRequired: 600, description: "Companies are scouting your applications" },
  7: { name: "Job Application Level", title: "Professional Applicant", clicksRequired: 1000, description: "Master of the application game" },
  8: { name: "Job Application Level", title: "Starting Lineup", clicksRequired: 1500, description: "First choice for interviews" },
  9: { name: "Job Application Level", title: "All-Star Applicant", clicksRequired: 2500, description: "Elite job search performance" },
  10: { name: "Job Application Level", title: "Superstar Candidate", clicksRequired: 4000, description: "One of the best applicants in the market" },
  11: { name: "Job Application Level", title: "MVP Applicant", clicksRequired: 6000, description: "Most valuable player in job applications" },
  12: { name: "Job Application Level", title: "Application Legend", clicksRequired: 10000, description: "Your application legacy is secure" }
};

export const SKINS = {
  rookie: { name: "Rookie", description: "Basic basketball uniform", unlockLevel: 1, color: "#6B7280" },
  jv: { name: "JV Jersey", description: "Junior varsity team colors", unlockLevel: 2, color: "#3B82F6" },
  varsity: { name: "Varsity Gold", description: "High school championship jersey", unlockLevel: 3, color: "#F59E0B" },
  college: { name: "College Blue", description: "University team colors", unlockLevel: 4, color: "#1E40AF" },
  d1: { name: "Elite Red", description: "Division 1 championship gear", unlockLevel: 5, color: "#DC2626" },
  draft: { name: "Draft Day", description: "Professional draft day suit", unlockLevel: 6, color: "#7C3AED" },
  nba: { name: "NBA Home", description: "Professional home jersey", unlockLevel: 7, color: "#059669" },
  starter: { name: "Starter Special", description: "Starting lineup jersey", unlockLevel: 8, color: "#0891B2" },
  allstar: { name: "All-Star", description: "All-Star game special edition", unlockLevel: 9, color: "#EA580C" },
  superstar: { name: "Superstar", description: "Signature player edition", unlockLevel: 10, color: "#9333EA" },
  mvp: { name: "MVP Trophy", description: "Most Valuable Player award", unlockLevel: 11, color: "#FBBF24" },
  legend: { name: "Hall of Fame", description: "Basketball Hall of Fame honor", unlockLevel: 12, color: "#F87171" }
};

export const ACHIEVEMENTS = {
  firstClick: { name: "First Application", description: "Submitted your first job application", icon: "🎯" },
  streak3: { name: "Triple Threat", description: "3-day application streak", icon: "🔥" },
  streak7: { name: "Weekly Warrior", description: "7-day application streak", icon: "⚡" },
  streak30: { name: "Monthly Master", description: "30-day application streak", icon: "💎" },
  hundred: { name: "Century Club", description: "100 total applications", icon: "💯" },
  thousand: { name: "Thousand Club", description: "1,000 total applications", icon: "🎯" },
  tenThousand: { name: "Elite Applicant", description: "10,000 total applications", icon: "👑" },
  dailyChamp: { name: "Daily Champion", description: "Complete 10 daily challenges", icon: "🏆" },
  perfectWeek: { name: "Perfect Week", description: "Apply 7 days in a row", icon: "⭐" },
  nightOwl: { name: "Night Owl", description: "Apply after 10 PM", icon: "🦉" },
  earlyBird: { name: "Early Bird", description: "Apply before 6 AM", icon: "🐦" },
  speedster: { name: "Speed Demon", description: "100 applications in one day", icon: "💨" },
  marathon: { name: "Marathon Runner", description: "500 applications in one day", icon: "🏃" }
};

export const CHALLENGE_TYPES = [
  {
    type: "daily_applications",
    generateChallenge: (level: number) => ({
      targetValue: Math.max(5, level * 2),
      description: `Submit ${Math.max(5, level * 2)} job applications today`,
      reward: "25 XP + Progress towards next level"
    })
  },
  {
    type: "streak_maintain",
    generateChallenge: () => ({
      targetValue: 1,
      description: "Maintain your daily application streak - don't break the chain!",
      reward: "Streak bonus + 15 XP"
    })
  },
  {
    type: "morning_applications",
    generateChallenge: () => ({
      targetValue: 3,
      description: "Early morning hustle - submit 3 applications before 8 AM",
      reward: "Early Bird achievement progress + 20 XP"
    })
  },
  {
    type: "consistency",
    generateChallenge: (level: number) => ({
      targetValue: Math.max(2, Math.floor(level / 2)),
      description: `Show consistency - apply to at least ${Math.max(2, Math.floor(level / 2))} jobs every 2 hours for 6 hours`,
      reward: "Consistency bonus + 30 XP"
    })
  }
];

export function calculateLevel(totalClicks: number): number {
  let level = 1;
  for (const [levelNum, data] of Object.entries(CAREER_LEVELS)) {
    if (totalClicks >= data.clicksRequired) {
      level = parseInt(levelNum);
    } else {
      break;
    }
  }
  return level;
}

export function getUnlockedSkins(level: number): string[] {
  return Object.entries(SKINS)
    .filter(([_, skin]) => skin.unlockLevel <= level)
    .map(([key, _]) => key);
}

export function checkAchievements(
  totalClicks: number, 
  streakCount: number, 
  todayClicks: number,
  currentAchievements: string[],
  isEarlyMorning: boolean,
  isLateNight: boolean,
  dailyChallengesCompleted: number
): string[] {
  const newAchievements: string[] = [];
  const existingAchievements = currentAchievements || [];

  // Click-based achievements
  if (totalClicks >= 1 && !existingAchievements.includes('firstClick')) {
    newAchievements.push('firstClick');
  }
  if (totalClicks >= 100 && !existingAchievements.includes('hundred')) {
    newAchievements.push('hundred');
  }
  if (totalClicks >= 1000 && !existingAchievements.includes('thousand')) {
    newAchievements.push('thousand');
  }
  if (totalClicks >= 10000 && !existingAchievements.includes('tenThousand')) {
    newAchievements.push('tenThousand');
  }

  // Streak achievements
  if (streakCount >= 3 && !existingAchievements.includes('streak3')) {
    newAchievements.push('streak3');
  }
  if (streakCount >= 7 && !existingAchievements.includes('streak7')) {
    newAchievements.push('streak7');
  }
  if (streakCount >= 30 && !existingAchievements.includes('streak30')) {
    newAchievements.push('streak30');
  }

  // Daily achievements
  if (todayClicks >= 100 && !existingAchievements.includes('speedster')) {
    newAchievements.push('speedster');
  }
  if (todayClicks >= 500 && !existingAchievements.includes('marathon')) {
    newAchievements.push('marathon');
  }

  // Time-based achievements
  if (isEarlyMorning && !existingAchievements.includes('earlyBird')) {
    newAchievements.push('earlyBird');
  }
  if (isLateNight && !existingAchievements.includes('nightOwl')) {
    newAchievements.push('nightOwl');
  }

  // Challenge achievements
  if (dailyChallengesCompleted >= 10 && !existingAchievements.includes('dailyChamp')) {
    newAchievements.push('dailyChamp');
  }

  return newAchievements;
}

export function generateDailyChallenge(date: string, level: number): any {
  const challengeTypes = CHALLENGE_TYPES;
  const randomType = challengeTypes[Math.floor(Math.random() * challengeTypes.length)];
  const challenge = randomType.generateChallenge(level);
  
  return {
    date,
    challengeType: randomType.type,
    targetValue: challenge.targetValue,
    description: challenge.description,
    reward: challenge.reward
  };
}