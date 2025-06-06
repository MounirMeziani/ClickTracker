import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertClickRecordSchema, updateClickRecordSchema } from "@shared/schema";
import { 
  calculateLevel, 
  getUnlockedSkins, 
  checkAchievements, 
  generateDailyChallenge, 
  CAREER_LEVELS, 
  SKINS, 
  ACHIEVEMENTS 
} from "./gameLogic";
import {
  generateMockFriends,
  generateMotivationalMessage,
  generateActivityHeatmap,
  getActivityColor,
  calculateWeeklyStreak
} from "./socialSystem";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get today's click count
  app.get("/api/clicks/today", async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const record = await storage.getClickRecordByDate(today);
      res.json({ clicks: record?.clicks || 0, date: today });
    } catch (error) {
      res.status(500).json({ message: "Failed to get today's clicks" });
    }
  });

  // Increment today's click count with game progression
  app.post("/api/clicks/increment", async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const now = new Date();
      const hour = now.getHours();
      const isEarlyMorning = hour >= 5 && hour < 8;
      const isLateNight = hour >= 22 || hour < 5;

      // Update click record
      const existingRecord = await storage.getClickRecordByDate(today);
      let record;
      if (existingRecord) {
        record = await storage.updateClickRecord(today, existingRecord.clicks + 1);
      } else {
        record = await storage.createClickRecord({ date: today, clicks: 1 });
      }

      // Get or create player profile
      let profile = await storage.getPlayerProfile();
      let oldLevel = 1;
      let newLevel = 1;
      let newSkin = "rookie";
      let newAchievements: string[] = [];
      let leveledUp = false;
      let oldSkin = "rookie";
      
      if (!profile) {
        profile = await storage.createPlayerProfile({
          currentLevel: 1,
          totalClicks: 1,
          currentSkin: "rookie"
        });
        newLevel = 1;
        newSkin = "rookie";
        oldSkin = "rookie";
      } else {
        // Update total clicks and level
        const newTotalClicks = profile.totalClicks + 1;
        oldLevel = profile.currentLevel;
        oldSkin = profile.currentSkin;
        newLevel = calculateLevel(newTotalClicks);
        const unlockedSkins = getUnlockedSkins(newLevel);
        
        // Auto-upgrade skin when reaching new level
        newSkin = profile.currentSkin;
        if (newLevel > oldLevel) {
          // Get the skin that corresponds to the new level
          const levelSkins = Object.entries(SKINS).filter(([_, skin]) => skin.unlockLevel === newLevel);
          if (levelSkins.length > 0) {
            newSkin = levelSkins[0][0]; // Use the first skin for that level
          }
        }
        
        // Check for new achievements
        newAchievements = checkAchievements(
          newTotalClicks,
          profile.streakCount,
          record.clicks,
          profile.achievements,
          isEarlyMorning,
          isLateNight,
          0 // TODO: track daily challenges completed
        );

        profile = await storage.updatePlayerProfile({
          ...profile,
          totalClicks: newTotalClicks,
          currentLevel: newLevel,
          currentSkin: newSkin,
          unlockedSkins,
          achievements: [...profile.achievements, ...newAchievements]
        });
      }

      leveledUp = newLevel > oldLevel;
      res.json({ 
        record, 
        profile,
        levelUp: leveledUp,
        skinChanged: newSkin !== oldSkin,
        newSkin: newSkin,
        levelData: leveledUp ? CAREER_LEVELS[newLevel as keyof typeof CAREER_LEVELS] : null,
        newAchievements: newAchievements
      });
    } catch (error) {
      console.error('Increment error:', error);
      res.status(500).json({ message: "Failed to increment clicks" });
    }
  });

  // Decrement today's click count
  app.post("/api/clicks/decrement", async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const existingRecord = await storage.getClickRecordByDate(today);
      
      if (!existingRecord || existingRecord.clicks <= 0) {
        res.json({ clicks: 0, date: today });
        return;
      }
      
      const record = await storage.updateClickRecord(today, existingRecord.clicks - 1);
      res.json(record);
    } catch (error) {
      res.status(500).json({ message: "Failed to decrement clicks" });
    }
  });

  // Get weekly statistics
  app.get("/api/clicks/weekly", async (req, res) => {
    try {
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay()); // Start of current week (Sunday)
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // End of current week (Saturday)
      
      const records = await storage.getClickRecordsInRange(
        startOfWeek.toISOString().split('T')[0],
        endOfWeek.toISOString().split('T')[0]
      );
      
      const totalClicks = records.reduce((sum, record) => sum + record.clicks, 0);
      const daysWithClicks = records.length;
      const averageClicks = daysWithClicks > 0 ? totalClicks / 7 : 0; // Average over 7 days
      
      res.json({
        totalClicks,
        averageClicks: Math.round(averageClicks * 10) / 10,
        daysWithClicks,
        records
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get weekly statistics" });
    }
  });

  // Get monthly statistics
  app.get("/api/clicks/monthly", async (req, res) => {
    try {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      const records = await storage.getClickRecordsInRange(
        startOfMonth.toISOString().split('T')[0],
        endOfMonth.toISOString().split('T')[0]
      );
      
      const totalClicks = records.reduce((sum, record) => sum + record.clicks, 0);
      const daysInMonth = endOfMonth.getDate();
      const averageClicks = totalClicks / daysInMonth;
      
      res.json({
        totalClicks,
        averageClicks: Math.round(averageClicks * 10) / 10,
        daysWithClicks: records.length,
        daysInMonth,
        records
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get monthly statistics" });
    }
  });

  // Get all-time statistics
  app.get("/api/clicks/all-time", async (req, res) => {
    try {
      const allRecords = await storage.getAllClickRecords();
      const totalClicks = allRecords.reduce((sum, record) => sum + record.clicks, 0);
      const daysActive = allRecords.length;
      const bestDay = allRecords.reduce((max, record) => 
        record.clicks > max ? record.clicks : max, 0
      );
      
      res.json({
        totalClicks,
        daysActive,
        bestDay,
        averageClicks: daysActive > 0 ? Math.round((totalClicks / daysActive) * 10) / 10 : 0
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get all-time statistics" });
    }
  });

  // Get last 7 days breakdown
  app.get("/api/clicks/last-7-days", async (req, res) => {
    try {
      const today = new Date();
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 6);
      
      const records = await storage.getClickRecordsInRange(
        sevenDaysAgo.toISOString().split('T')[0],
        today.toISOString().split('T')[0]
      );
      
      // Create array of last 7 days with click counts
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const record = records.find(r => r.date === dateStr);
        const clicks = record?.clicks || 0;
        
        last7Days.push({
          date: dateStr,
          clicks,
          dayName: date.toLocaleDateString('en-US', { weekday: 'long' }),
          shortDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          isToday: i === 0
        });
      }
      
      res.json(last7Days);
    } catch (error) {
      res.status(500).json({ message: "Failed to get last 7 days data" });
    }
  });

  // Get player profile and game data
  app.get("/api/player/profile", async (req, res) => {
    try {
      let profile = await storage.getPlayerProfile();
      if (!profile) {
        profile = await storage.createPlayerProfile({
          currentLevel: 1,
          totalClicks: 0,
          currentSkin: "rookie"
        });
      }

      const levelData = CAREER_LEVELS[profile.currentLevel as keyof typeof CAREER_LEVELS];
      const nextLevelData = CAREER_LEVELS[(profile.currentLevel + 1) as keyof typeof CAREER_LEVELS];
      
      res.json({
        profile,
        levelData,
        nextLevelData,
        availableSkins: Object.entries(SKINS).map(([key, skin]) => ({
          id: key,
          ...skin,
          unlocked: profile.unlockedSkins.includes(key)
        })),
        achievements: Object.entries(ACHIEVEMENTS).map(([key, achievement]) => ({
          id: key,
          ...achievement,
          unlocked: profile.achievements.includes(key)
        }))
      });
    } catch (error) {
      console.error('Profile error:', error);
      res.status(500).json({ message: "Failed to get player profile" });
    }
  });

  // Update player skin
  app.post("/api/player/skin", async (req, res) => {
    try {
      const { skinId } = req.body;
      let profile = await storage.getPlayerProfile();
      
      if (!profile) {
        return res.status(404).json({ message: "Player profile not found" });
      }

      if (!profile.unlockedSkins.includes(skinId)) {
        return res.status(400).json({ message: "Skin not unlocked" });
      }

      profile = await storage.updatePlayerProfile({
        ...profile,
        currentSkin: skinId
      });

      res.json(profile);
    } catch (error) {
      res.status(500).json({ message: "Failed to update skin" });
    }
  });

  // Get daily challenge
  app.get("/api/challenge/daily", async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      let challenge = await storage.getDailyChallengeByDate(today);
      
      if (!challenge) {
        // Generate new daily challenge
        const profile = await storage.getPlayerProfile();
        const level = profile?.currentLevel || 1;
        const challengeData = generateDailyChallenge(today, level);
        challenge = await storage.createDailyChallenge(challengeData);
      }

      res.json(challenge);
    } catch (error) {
      res.status(500).json({ message: "Failed to get daily challenge" });
    }
  });

  // Complete daily challenge
  app.post("/api/challenge/complete", async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      let profile = await storage.getPlayerProfile();
      
      if (!profile) {
        return res.status(404).json({ message: "Player profile not found" });
      }

      if (profile.dailyChallengeCompleted && profile.lastChallengeDate === today) {
        return res.status(400).json({ message: "Daily challenge already completed" });
      }

      // Update streak
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      let newStreak = 1;
      if (profile.lastChallengeDate === yesterdayStr) {
        newStreak = profile.streakCount + 1;
      }

      profile = await storage.updatePlayerProfile({
        ...profile,
        dailyChallengeCompleted: true,
        lastChallengeDate: today,
        streakCount: newStreak
      });

      res.json({ 
        success: true, 
        profile,
        streakCount: newStreak,
        reward: "Challenge completed! +50 XP"
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to complete challenge" });
    }
  });

  // Get leaderboard
  app.get("/api/social/leaderboard", async (req, res) => {
    try {
      const leaderboard = await storage.getLeaderboard(20);
      const currentProfile = await storage.getPlayerProfile();
      
      // Add mock friends for demonstration since this is a single-player demo
      const mockFriends = generateMockFriends();
      
      res.json({
        leaderboard,
        currentPlayer: currentProfile,
        friends: mockFriends
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get leaderboard" });
    }
  });

  // Get social feed with motivational messages
  app.get("/api/social/feed", async (req, res) => {
    try {
      const mockFriends = generateMockFriends();
      const motivationalMessage = generateMotivationalMessage();
      
      const feed = mockFriends.slice(0, 3).map(friend => ({
        id: friend.id,
        type: 'friend_activity',
        message: `${friend.name} ${friend.recentActivity}`,
        timestamp: new Date().toISOString(),
        friend: friend
      }));

      feed.push({
        id: 999,
        type: 'motivational',
        message: motivationalMessage,
        timestamp: new Date().toISOString(),
        friend: null as any
      });

      res.json(feed);
    } catch (error) {
      res.status(500).json({ message: "Failed to get social feed" });
    }
  });

  // Get activity heatmap (GitHub-style)
  app.get("/api/social/activity-heatmap", async (req, res) => {
    try {
      const profile = await storage.getPlayerProfile();
      if (!profile) {
        return res.status(404).json({ message: "Player profile not found" });
      }

      // Generate realistic activity data based on user's actual activity
      const activityData = generateActivityHeatmap(365);
      const weeklyStreak = calculateWeeklyStreak(activityData);
      
      res.json({
        activityData,
        weeklyStreak,
        totalContributions: activityData.reduce((sum, day) => sum + day.count, 0),
        longestStreak: Math.max(weeklyStreak, profile.streakCount)
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get activity data" });
    }
  });

  // Get friend comparison
  app.get("/api/social/friend-comparison/:friendId", async (req, res) => {
    try {
      const friendId = parseInt(req.params.friendId);
      const currentProfile = await storage.getPlayerProfile();
      const mockFriends = generateMockFriends();
      const friend = mockFriends.find(f => f.id === friendId);
      
      if (!friend || !currentProfile) {
        return res.status(404).json({ message: "Friend or profile not found" });
      }

      const comparison = {
        you: {
          level: currentProfile.currentLevel,
          totalShots: currentProfile.totalClicks,
          achievements: currentProfile.achievements.length,
          streak: currentProfile.streakCount
        },
        friend: {
          level: friend.level,
          totalShots: friend.totalShots,
          achievements: friend.achievements,
          streak: friend.currentStreak
        },
        insights: [
          currentProfile.totalClicks > friend.totalShots 
            ? "You're ahead in total shots!" 
            : "Your friend is leading in total shots!",
          currentProfile.currentLevel > friend.level
            ? "You've reached a higher level!"
            : "Your friend has achieved a higher level!",
          currentProfile.streakCount > friend.currentStreak
            ? "You have the longer streak!"
            : "Your friend has maintained a longer streak!"
        ]
      };

      res.json(comparison);
    } catch (error) {
      res.status(500).json({ message: "Failed to get friend comparison" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
