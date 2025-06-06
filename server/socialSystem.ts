// Team-focused motivational messages
export const TEAM_MOTIVATIONAL_MESSAGES = [
  // Team encouragement
  "Your teammate is cheering you on from the sidelines!",
  "The team believes you can reach the next level!",
  "Your teammates think you're destined for greatness!",
  "Your team captain is proud of your progress!",
  "The whole team is excited to see your growth!",
  "Your teammates know you have what it takes!",
  "Someone on the team is inspired by your dedication!",
  "The team is rooting for your success!",
  
  // Team activity messages
  "A teammate just unlocked a new achievement!",
  "Someone on your team reached a new level today!",
  "Your teammate is putting in serious work too!",
  "The team is grinding towards collective goals!",
  "Another player is building their basketball legacy!",
  "Your teammate is making moves on the court!",
  "The team is pushing their limits together!",
  "A teammate's streak is looking impressive!",
  
  // Team collaboration
  "Your team wants to train together!",
  "Teammates are sharing training tips!",
  "Someone asked about team achievements!",
  "A teammate shared a new training method!",
  "The team is planning a group session!",
  "Your teammates recommended new drills!",
  "The team wants to celebrate progress together!",
  "Your squad is planning friendly competitions!",
  
  // Team achievements
  "A teammate earned their first achievement!",
  "Someone completed their daily team challenge!",
  "They unlocked a rare team uniform!",
  "Your teammate hit a major milestone!",
  "Team consistency is paying off!",
  "A teammate had their best practice session!",
  "Someone discovered a new team strategy!",
  "Your teammate's improvement is incredible!",
  
  // Team support
  "Your team knows everyone improves at their own pace!",
  "Teammates appreciate each other's unique styles!",
  "The team values everyone's commitment!",
  "Your teammates admire your perseverance!",
  "The team understands progress isn't always linear!",
  "Your squad celebrates every small victory!",
  "Teammates respect each other's journey!",
  "The team knows everyone will achieve their goals!"
];

export const ACTIVITY_INSIGHTS = [
  "had an incredible practice session",
  "unlocked a new achievement",
  "reached a career milestone", 
  "completed their daily challenge",
  "discovered a new training routine",
  "improved their consistency",
  "had their best week yet",
  "earned a new uniform",
  "broke their personal record",
  "maintained their streak",
  "showed remarkable improvement",
  "demonstrated great dedication"
];

export function generateTeamMotivationalMessage(): string {
  return TEAM_MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * TEAM_MOTIVATIONAL_MESSAGES.length)];
}

export function generateMotivationalMessage(): string {
  return TEAM_MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * TEAM_MOTIVATIONAL_MESSAGES.length)];
}

export function generateActivityInsight(): string {
  return ACTIVITY_INSIGHTS[Math.floor(Math.random() * ACTIVITY_INSIGHTS.length)];
}

export function generateTeamUpdate(memberName: string): string {
  const insight = generateActivityInsight();
  return `${memberName} ${insight}`;
}

export function generateMockTeammates() {
  // Return empty array - teams will be managed through actual database
  return [];
}

// Generate GitHub-style activity data
export function generateActivityHeatmap(days: number = 365) {
  const activity = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    const dateStr = date.toISOString().split('T')[0];
    const dayOfWeek = date.getDay();
    
    // Generate realistic activity patterns
    let intensity = 0;
    
    // Less activity on weekends
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      intensity = Math.random() > 0.7 ? Math.floor(Math.random() * 3) + 1 : 0;
    } else {
      // More activity on weekdays
      intensity = Math.random() > 0.3 ? Math.floor(Math.random() * 4) + 1 : 0;
    }
    
    activity.push({
      date: dateStr,
      count: intensity * Math.floor(Math.random() * 25) + intensity * 5,
      level: intensity
    });
  }
  
  return activity;
}

export function getActivityColor(level: number): string {
  const colors = [
    '#f0f0f0', // 0 - no activity
    '#c6e48b', // 1 - low activity
    '#7bc96f', // 2 - medium activity  
    '#449d44', // 3 - high activity
    '#196127'  // 4 - very high activity
  ];
  return colors[Math.min(level, 4)];
}

export function calculateWeeklyStreak(activityData: Array<{date: string, level: number}>) {
  let currentStreak = 0;
  const today = new Date();
  
  for (let i = 0; i < 7; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() - i);
    const dateStr = checkDate.toISOString().split('T')[0];
    
    const dayActivity = activityData.find(a => a.date === dateStr);
    if (dayActivity && dayActivity.level > 0) {
      currentStreak++;
    } else {
      break;
    }
  }
  
  return currentStreak;
}