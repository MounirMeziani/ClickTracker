// Motivational speech bubbles for social interaction
export const MOTIVATIONAL_MESSAGES = [
  // Encouraging messages
  "Your friend is cheering you on from the sidelines!",
  "They believe you can reach the next level!",
  "Someone thinks you're destined for greatness!",
  "Your training partner is proud of your progress!",
  "They're excited to see where your journey takes you!",
  "Your friend knows you have what it takes!",
  "Someone is inspired by your dedication!",
  "They're rooting for your success story!",
  
  // Gentle competitive messages
  "Your friend just unlocked a new achievement!",
  "Someone reached a new level today!",
  "Your training buddy is putting in work too!",
  "They're also grinding towards their goals!",
  "Someone else is building their basketball legacy!",
  "Your friend is making moves on the court!",
  "They're pushing their limits just like you!",
  "Someone's streak is looking impressive!",
  
  // Collaborative messages
  "Your friend wants to train together!",
  "They're curious about your current uniform!",
  "Someone asked about your favorite achievement!",
  "Your training partner shared a tip with you!",
  "They suggested a practice session together!",
  "Your friend recommended a new training routine!",
  "Someone wants to celebrate your progress!",
  "They're planning a friendly competition!",
  
  // Achievement-focused messages
  "Your friend earned their first achievement!",
  "Someone just completed their daily challenge!",
  "They unlocked a rare uniform today!",
  "Your training buddy hit a major milestone!",
  "Someone's consistency is paying off!",
  "They just had their best practice session!",
  "Your friend discovered a new training method!",
  "Someone's improvement curve is incredible!",
  
  // Supportive messages
  "Your friend knows everyone improves at their own pace!",
  "They appreciate your unique training style!",
  "Someone values your commitment to growth!",
  "Your friend admires your perseverance!",
  "They understand that progress isn't always linear!",
  "Someone celebrates every small victory with you!",
  "Your training partner respects your journey!",
  "They know you'll achieve your goals in time!"
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

export function generateMotivationalMessage(): string {
  return MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)];
}

export function generateActivityInsight(): string {
  return ACTIVITY_INSIGHTS[Math.floor(Math.random() * ACTIVITY_INSIGHTS.length)];
}

export function generateFriendlyUpdate(friendName: string): string {
  const insight = generateActivityInsight();
  return `${friendName} ${insight}`;
}

// Generate mock friends for demonstration
export function generateMockFriends() {
  const names = [
    "Alex", "Jordan", "Casey", "Morgan", "Riley", "Avery", "Quinn", "Sage",
    "Rowan", "River", "Phoenix", "Skyler", "Cameron", "Taylor", "Jamie"
  ];
  
  return names.slice(0, 5 + Math.floor(Math.random() * 5)).map((name, index) => ({
    id: index + 1,
    name,
    level: Math.floor(Math.random() * 8) + 1,
    totalShots: Math.floor(Math.random() * 1000) + 50,
    currentStreak: Math.floor(Math.random() * 15) + 1,
    lastActive: `${Math.floor(Math.random() * 7) + 1} days ago`,
    achievements: Math.floor(Math.random() * 10) + 2,
    activityLevel: Math.random() > 0.3 ? 'active' : 'moderate',
    recentActivity: generateActivityInsight()
  }));
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