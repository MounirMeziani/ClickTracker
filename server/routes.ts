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
        const oldAchievements = profile.achievements || [];
        const currentHour = new Date().getHours();
        const isEarlyMorning = currentHour >= 5 && currentHour < 9;
        const isLateNight = currentHour >= 22 || currentHour < 5;
        const newAchievements = checkAchievements(
          newTotalClicks, 
          profile.streakCount, 
          record.clicks,
          oldAchievements,
          isEarlyMorning,
          isLateNight,
          0 // dailyChallengesCompleted - placeholder for now
        );
        const achievementUnlocked = newAchievements.length > oldAchievements.length;
        const unlockedAchievementNames = newAchievements.filter(a => !oldAchievements.includes(a));

        // Update only the basic fields to avoid JSON parsing issues
        profile = await storage.updatePlayerProfile({
          totalClicks: newTotalClicks,
          currentLevel: newLevel,
          currentSkin: newSkin
        });

        // Update arrays separately using raw SQL to avoid JSON parsing issues
        if (newSkins.length !== oldSkins.length || newAchievements.length !== oldAchievements.length) {
          await db.execute(`
            UPDATE player_profile 
            SET unlocked_skins = $1, achievements = $2, updated_at = NOW()
            WHERE id = $3
          `, [newSkins, newAchievements, profile.id]);
          
          // Refresh profile data
          profile = await storage.getPlayerProfile() || profile;
        }

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
        averageClicks: Math.round((totalClicks / 7) * 10) / 10,
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
        averageClicks: Math.round((totalClicks / daysInMonth) * 10) / 10,
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
        averageClicks: daysActive > 0 ? Math.round((totalClicks / daysActive) * 10) / 10 : 0
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

  // Simplified goal management routes
  app.get("/api/goals", async (req, res) => {
    try {
      const goals = [
        { id: 1, name: "Free Throw Shooting", description: "Master your free throw technique and consistency", category: "shooting", maxLevel: 12 },
        { id: 2, name: "Ball Handling", description: "Improve your dribbling skills and ball control", category: "fundamentals", maxLevel: 12 },
        { id: 3, name: "Defensive Stance", description: "Perfect your defensive positioning and footwork", category: "defense", maxLevel: 12 },
        { id: 4, name: "Court Conditioning", description: "Build basketball-specific endurance and agility", category: "fitness", maxLevel: 12 },
        { id: 5, name: "3-Point Shooting", description: "Extend your range and improve 3-point accuracy", category: "shooting", maxLevel: 12 },
        { id: 6, name: "Layup Finishing", description: "Master finishing around the rim with both hands", category: "shooting", maxLevel: 12 }
      ];
      res.json(goals);
    } catch (error) {
      res.status(500).json({ message: "Failed to get goals" });
    }
  });

  app.get("/api/player/goals", async (req, res) => {
    try {
      const profile = await storage.getPlayerProfile();
      const weeklyAverage = 15.3; // Based on current stats
      const dailyAverage = 107; // Based on current stats
      const minimumThreshold = Math.round(weeklyAverage * 0.3);

      const playerGoals = [
        {
          id: 1,
          goalId: 1,
          currentLevel: profile?.currentLevel || 1,
          totalClicks: profile?.totalClicks || 0,
          levelPoints: (profile?.totalClicks || 0) * 1.2,
          weeklyTarget: minimumThreshold,
          lastActivityDate: new Date().toISOString().split('T')[0],
          goal: { id: 1, name: "Free Throw Shooting", description: "Master your free throw technique", category: "shooting", maxLevel: 12 },
          category: { name: "Shooting", color: "#f59e0b", icon: "🏀" },
          decayInfo: { daysInactive: 0, pointsLost: 0 }
        },
        {
          id: 2,
          goalId: 2,
          currentLevel: 1,
          totalClicks: 0,
          levelPoints: 0,
          weeklyTarget: minimumThreshold,
          lastActivityDate: null,
          goal: { id: 2, name: "Ball Handling", description: "Improve your dribbling skills", category: "fundamentals", maxLevel: 12 },
          category: { name: "Fundamentals", color: "#3b82f6", icon: "⚡" },
          decayInfo: { daysInactive: 0, pointsLost: 0 }
        }
      ];

      res.json(playerGoals);
    } catch (error) {
      res.status(500).json({ message: "Failed to get player goals" });
    }
  });

  app.post("/api/goals/:goalId/click", async (req, res) => {
    try {
      const goalId = parseInt(req.params.goalId);
      
      // For now, use the main click tracking system
      const today = new Date().toISOString().split('T')[0];
      let record = await storage.getClickRecordByDate(today);
      
      if (record) {
        record = await storage.updateClickRecord(today, record.clicks + 1);
      } else {
        record = await storage.createClickRecord({ date: today, clicks: 1 });
      }

      // Update main player profile
      let profile = await storage.getPlayerProfile();
      if (profile) {
        const oldLevel = profile.currentLevel;
        const newTotalClicks = profile.totalClicks + 1;
        
        profile = await storage.updatePlayerProfile({
          ...profile,
          totalClicks: newTotalClicks
        });

        const levelUp = profile.currentLevel > oldLevel;
        
        res.json({
          record,
          playerGoal: {
            ...profile,
            goalId,
            levelPoints: newTotalClicks * 1.2
          },
          levelUp,
          progressMessage: levelUp ? `Great progress! You've improved your training level!` : null
        });
      } else {
        res.status(404).json({ message: "Player profile not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to record goal click" });
    }
  });

  app.get("/api/goals/:goalId/stats", async (req, res) => {
    try {
      const goalId = parseInt(req.params.goalId);
      const profile = await storage.getPlayerProfile();
      
      // Get last 7 days for weekly stats
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 6);
      
      const records = await storage.getClickRecordsInRange(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );

      const weeklyClicks = records.reduce((sum, record) => sum + record.clicks, 0);
      const weeklyTarget = Math.round(15.3 * 0.3); // 30% of average
      const progressPercentage = weeklyTarget > 0 ? (weeklyClicks / weeklyTarget) * 100 : 0;

      // Prepare daily data
      const dailyData = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(endDate.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const record = records.find(r => r.date === dateStr);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        
        dailyData.push({
          date: dateStr,
          clicks: record?.clicks || 0,
          dayName,
          isToday: i === 0
        });
      }

      const goalData = {
        1: { name: "Free Throw Shooting", description: "Master your free throw technique", category: "shooting" },
        2: { name: "Ball Handling", description: "Improve your dribbling skills", category: "fundamentals" }
      }[goalId] || { name: "Training Goal", description: "Basketball skill development", category: "general" };

      res.json({
        goal: goalData,
        playerGoal: {
          ...profile,
          goalId,
          levelPoints: (profile?.totalClicks || 0) * 1.2,
          weeklyTarget
        },
        weeklyStats: {
          clicks: weeklyClicks,
          target: weeklyTarget,
          progressPercentage: Math.round(progressPercentage * 10) / 10,
          metTarget: weeklyClicks >= weeklyTarget
        },
        dailyData
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get goal stats" });
    }
  });

  app.post("/api/player/active-goal", async (req, res) => {
    try {
      const { goalId } = req.body;
      
      const goalData = {
        1: { id: 1, name: "Free Throw Shooting", description: "Master your free throw technique", category: "shooting" },
        2: { id: 2, name: "Ball Handling", description: "Improve your dribbling skills", category: "fundamentals" }
      }[goalId];
      
      if (!goalData) {
        return res.status(404).json({ message: "Goal not found" });
      }

      res.json({ 
        success: true, 
        activeGoal: goalData,
        message: `Switched to ${goalData.name}` 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to switch goal" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}