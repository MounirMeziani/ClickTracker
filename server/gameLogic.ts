// Basketball career progression system
export const CAREER_LEVELS = {
  1: { name: "Rookie", title: "Playground Beginner", clicksRequired: 0, description: "Just starting your basketball journey" },
  2: { name: "JV Player", title: "Junior Varsity", clicksRequired: 100, description: "Making moves on the JV team" },
  3: { name: "Varsity Star", title: "High School Hero", clicksRequired: 500, description: "Leading your high school team" },
  4: { name: "College Recruit", title: "D2 College Player", clicksRequired: 1500, description: "Playing at the college level" },
  5: { name: "D1 Athlete", title: "Division 1 Star", clicksRequired: 5000, description: "Competing with the best college players" },
  6: { name: "Draft Prospect", title: "NBA Draft Prospect", clicksRequired: 10000, description: "Scouts are watching your every move" },
  7: { name: "NBA Rookie", title: "Professional Basketball Player", clicksRequired: 20000, description: "Welcome to the big leagues" },
  8: { name: "NBA Starter", title: "Starting Five", clicksRequired: 40000, description: "Earning your spot in the starting lineup" },
  9: { name: "All-Star", title: "NBA All-Star", clicksRequired: 80000, description: "Playing with the league's elite" },
  10: { name: "Superstar", title: "NBA Superstar", clicksRequired: 150000, description: "One of the best players in the world" },
  11: { name: "MVP", title: "Most Valuable Player", clicksRequired: 250000, description: "The league's most valuable player" },
  12: { name: "Legend", title: "Basketball Legend", clicksRequired: 500000, description: "Your name will be remembered forever" }
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
  firstClick: { name: "First Shot", description: "Made your first click", icon: "🏀" },
  streak3: { name: "Triple Threat", description: "3-day streak", icon: "🔥" },
  streak7: { name: "Weekly Warrior", description: "7-day streak", icon: "⚡" },
  streak30: { name: "Monthly Master", description: "30-day streak", icon: "💎" },
  hundred: { name: "Century", description: "100 total clicks", icon: "💯" },
  thousand: { name: "Thousand Club", description: "1,000 total clicks", icon: "🎯" },
  tenThousand: { name: "Elite Scorer", description: "10,000 total clicks", icon: "👑" },
  dailyChamp: { name: "Daily Champion", description: "Complete 10 daily challenges", icon: "🏆" },
  perfectWeek: { name: "Perfect Week", description: "Complete 7 days in a row", icon: "⭐" },
  nightOwl: { name: "Night Owl", description: "Click after 10 PM", icon: "🦉" },
  earlyBird: { name: "Early Bird", description: "Click before 6 AM", icon: "🐦" },
  speedster: { name: "Speed Demon", description: "100 clicks in one day", icon: "💨" },
  marathon: { name: "Marathon Runner", description: "500 clicks in one day", icon: "🏃" }
};

export const CHALLENGE_TYPES = [
  {
    type: "daily_clicks",
    generateChallenge: (level: number) => ({
      targetValue: Math.max(10, level * 5),
      description: `Score ${Math.max(10, level * 5)} shots today`,
      reward: "25 XP + Progress towards next level"
    })
  },
  {
    type: "streak_maintain",
    generateChallenge: () => ({
      targetValue: 1,
      description: "Maintain your daily streak - don't break the chain!",
      reward: "Streak bonus + 15 XP"
    })
  },
  {
    type: "morning_practice",
    generateChallenge: () => ({
      targetValue: 5,
      description: "Early morning practice - click 5 times before 8 AM",
      reward: "Early Bird achievement progress + 20 XP"
    })
  },
  {
    type: "consistency",
    generateChallenge: (level: number) => ({
      targetValue: Math.max(3, Math.floor(level / 2)),
      description: `Show consistency - click at least ${Math.max(3, Math.floor(level / 2))} times every hour for 3 hours`,
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

  // Click-based achievements
  if (totalClicks >= 1 && !currentAchievements.includes('firstClick')) {
    newAchievements.push('firstClick');
  }
  if (totalClicks >= 100 && !currentAchievements.includes('hundred')) {
    newAchievements.push('hundred');
  }
  if (totalClicks >= 1000 && !currentAchievements.includes('thousand')) {
    newAchievements.push('thousand');
  }
  if (totalClicks >= 10000 && !currentAchievements.includes('tenThousand')) {
    newAchievements.push('tenThousand');
  }

  // Streak achievements
  if (streakCount >= 3 && !currentAchievements.includes('streak3')) {
    newAchievements.push('streak3');
  }
  if (streakCount >= 7 && !currentAchievements.includes('streak7')) {
    newAchievements.push('streak7');
  }
  if (streakCount >= 30 && !currentAchievements.includes('streak30')) {
    newAchievements.push('streak30');
  }

  // Daily achievements
  if (todayClicks >= 100 && !currentAchievements.includes('speedster')) {
    newAchievements.push('speedster');
  }
  if (todayClicks >= 500 && !currentAchievements.includes('marathon')) {
    newAchievements.push('marathon');
  }

  // Time-based achievements
  if (isEarlyMorning && !currentAchievements.includes('earlyBird')) {
    newAchievements.push('earlyBird');
  }
  if (isLateNight && !currentAchievements.includes('nightOwl')) {
    newAchievements.push('nightOwl');
  }

  // Challenge achievements
  if (dailyChallengesCompleted >= 10 && !currentAchievements.includes('dailyChamp')) {
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