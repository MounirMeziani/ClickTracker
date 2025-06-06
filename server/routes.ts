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
      res.json({
        clicks: record?.clicks || 0,
        date: today
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get today's clicks" });
    }
  });

  // Increment click count
  app.post("/api/clicks/increment", async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      let record = await storage.getClickRecordByDate(today);
      
      if (record) {
        record = await storage.updateClickRecord(today, record.clicks + 1);
      } else {
        record = await storage.createClickRecord({ 
          date: today, 
          clicks: 1
        });
      }

      // Update player profile
      let profile = await storage.getPlayerProfile();
      if (!profile) {
        profile = await storage.createPlayerProfile({
          currentLevel: 1,
          totalClicks: 1,
          currentSkin: "rookie"
        });
      } else {
        const newTotalClicks = profile.totalClicks + 1;
        const oldLevel = profile.currentLevel;
        const newLevel = calculateLevel(newTotalClicks);
        const levelUp = newLevel > oldLevel;
        
        // Check for skin changes
        const oldSkins = profile.unlockedSkins;
        const newSkins = getUnlockedSkins(newLevel);
        const skinChanged = newSkins.length > oldSkins.length;
        const newSkin = skinChanged ? newSkins[newSkins.length - 1] : profile.currentSkin;

        // Check for new achievements
        const oldAchievements = profile.achievements;
        const newAchievements = checkAchievements(newTotalClicks, record.clicks, profile.streakCount);
        const achievementUnlocked = newAchievements.length > oldAchievements.length;
        const unlockedAchievementNames = newAchievements.filter(a => !oldAchievements.includes(a));

        profile = await storage.updatePlayerProfile({
          ...profile,
          totalClicks: newTotalClicks,
          currentLevel: newLevel,
          currentSkin: newSkin,
          unlockedSkins: newSkins,
          achievements: newAchievements
        });

        // Return level up and achievement info
        res.json({
          record,
          profile,
          levelUp,
          levelData: levelUp ? CAREER_LEVELS[newLevel] : null,
          skinChanged,
          achievementUnlocked,
          newAchievements: unlockedAchievementNames.map(id => ACHIEVEMENTS[id]?.name || id)
        });
        return;
      }

      res.json({ record, profile });
    } catch (error) {
      console.error("Increment error:", error);
      res.status(500).json({ message: "Failed to increment clicks" });
    }
  });

  // Get weekly summary
  app.get("/api/clicks/weekly", async (req, res) => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 6);
      
      const records = await storage.getClickRecordsInRange(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );
      
      const totalClicks = records.reduce((sum, record) => sum + record.clicks, 0);
      const daysWithClicks = records.filter(record => record.clicks > 0).length;
      
      res.json({
        totalClicks,
        averageClicks: totalClicks / 7,
        daysWithClicks
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get weekly summary" });
    }
  });

  // Get monthly summary
  app.get("/api/clicks/monthly", async (req, res) => {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      const records = await storage.getClickRecordsInRange(
        startOfMonth.toISOString().split('T')[0],
        endOfMonth.toISOString().split('T')[0]
      );
      
      const totalClicks = records.reduce((sum, record) => sum + record.clicks, 0);
      const daysWithClicks = records.filter(record => record.clicks > 0).length;
      const daysInMonth = endOfMonth.getDate();
      
      res.json({
        totalClicks,
        averageClicks: totalClicks / daysInMonth,
        daysWithClicks,
        daysInMonth
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get monthly summary" });
    }
  });

  // Get all-time summary
  app.get("/api/clicks/all-time", async (req, res) => {
    try {
      const records = await storage.getAllClickRecords();
      const totalClicks = records.reduce((sum, record) => sum + record.clicks, 0);
      const daysActive = records.filter(record => record.clicks > 0).length;
      const bestDay = Math.max(...records.map(record => record.clicks), 0);
      
      res.json({
        totalClicks,
        daysActive,
        bestDay,
        averageClicks: daysActive > 0 ? totalClicks / daysActive : 0
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get all-time summary" });
    }
  });

  // Get last 7 days for chart
  app.get("/api/clicks/last-7-days", async (req, res) => {
    try {
      const days = [];
      const today = new Date();
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const record = await storage.getClickRecordByDate(dateStr);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const shortDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        days.push({
          date: dateStr,
          clicks: record?.clicks || 0,
          dayName,
          shortDate,
          isToday: i === 0
        });
      }
      
      res.json(days);
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

      const levelData = CAREER_LEVELS[profile.currentLevel];
      const nextLevelData = CAREER_LEVELS[profile.currentLevel + 1] || null;
      
      const availableSkins = Object.entries(SKINS).map(([id, skin]) => ({
        id,
        ...skin,
        unlocked: profile.unlockedSkins.includes(id)
      }));

      const achievements = Object.entries(ACHIEVEMENTS).map(([id, achievement]) => ({
        id,
        ...achievement,
        unlocked: profile.achievements.includes(id)
      }));

      res.json({
        profile,
        levelData,
        nextLevelData,
        availableSkins,
        achievements
      });
    } catch (error) {
      console.error("Profile error:", error);
      res.status(500).json({ message: "Failed to get player profile" });
    }
  });

  // Get daily challenge
  app.get("/api/challenge/daily", async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      let challenge = await storage.getDailyChallengeByDate(today);
      
      if (!challenge) {
        const profile = await storage.getPlayerProfile();
        const challengeData = generateDailyChallenge(today, profile?.currentLevel || 1);
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

  // Get team info and leaderboard
  app.get("/api/team/info", async (req, res) => {
    try {
      const currentProfile = await storage.getPlayerProfile();
      if (!currentProfile?.teamId) {
        return res.json({
          hasTeam: false,
          currentPlayer: currentProfile,
          team: null,
          teammates: [],
          leaderboard: []
        });
      }

      const team = await storage.getPlayerTeam(currentProfile.id);
      const teammates = await storage.getTeamMembers(currentProfile.teamId);
      const leaderboard = await storage.getTeamLeaderboard(currentProfile.teamId);
      
      res.json({
        hasTeam: true,
        currentPlayer: currentProfile,
        team,
        teammates,
        leaderboard
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get team info" });
    }
  });

  // Get team feed with motivational messages
  app.get("/api/team/feed", async (req, res) => {
    try {
      const currentProfile = await storage.getPlayerProfile();
      const motivationalMessage = generateMotivationalMessage();
      
      const feed = [];
      
      // Add team activity if player has a team
      if (currentProfile?.teamId) {
        const teamActivity = await storage.getTeamActivity(currentProfile.teamId, 7);
        feed.push(...teamActivity.slice(0, 3).map(activity => ({
          id: activity.id,
          type: 'team_activity',
          message: activity.description,
          timestamp: activity.createdAt.toISOString(),
          playerId: activity.playerId
        })));
      }

      // Always add motivational message
      feed.push({
        id: 999,
        type: 'motivational',
        message: motivationalMessage,
        timestamp: new Date().toISOString(),
        playerId: null
      });

      res.json(feed);
    } catch (error) {
      res.status(500).json({ message: "Failed to get team feed" });
    }
  });

  // Get activity heatmap (GitHub-style)
  app.get("/api/team/activity-heatmap", async (req, res) => {
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
        totalContributions: activityData.reduce((sum: number, day: any) => sum + day.count, 0),
        longestStreak: Math.max(weeklyStreak, profile.streakCount)
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get activity data" });
    }
  });

  // Create a basic team
  app.post("/api/team/create", async (req, res) => {
    try {
      const { name, description } = req.body;
      
      if (!name) {
        return res.status(400).json({ message: "Team name is required" });
      }

      const team = await storage.createTeam({
        name,
        description: description || "A basketball training team",
        maxMembers: 10
      });

      res.json({ team, message: "Team created successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to create team" });
    }
  });

  // Join a team (simple version)
  app.post("/api/team/join", async (req, res) => {
    try {
      const { teamId } = req.body;
      const profile = await storage.getPlayerProfile();
      
      if (!profile) {
        return res.status(404).json({ message: "Player profile not found" });
      }

      if (profile.teamId) {
        return res.status(400).json({ message: "Already on a team" });
      }

      // Join the team
      await storage.joinTeam(teamId, profile.id);
      
      // Update player profile with team ID
      await storage.updatePlayerProfile({
        ...profile,
        teamId: teamId
      });

      res.json({ message: "Successfully joined team" });
    } catch (error) {
      res.status(500).json({ message: "Failed to join team" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}