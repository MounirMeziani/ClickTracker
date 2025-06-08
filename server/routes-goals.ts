import type { Express } from "express";
import { storage } from "./storage";
import { calculateLevel } from "./gameLogic";
import { 
  BASKETBALL_GOALS, 
  GOAL_CATEGORIES, 
  calculateLevelDecay, 
  calculateWeeklyTarget, 
  addPointsForActivity,
  calculateLevelFromPoints,
  getGoalProgressMessage
} from "./goalSystem";

export function registerGoalRoutes(app: Express) {
  // Create a new goal
  app.post("/api/goals", async (req, res) => {
    try {
      const { name, description, category } = req.body;
      
      if (!name || !name.trim()) {
        return res.status(400).json({ message: "Name is required" });
      }

      const newGoal = await storage.createGoal({
        name: name.trim(),
        description: description || "Custom goal",
        category: category || "productivity"
      });

      // Also create a player goal for the new goal
      const profile = await storage.getPlayerProfile();
      if (profile) {
        await storage.createPlayerGoal({
          playerId: 1, // Default player ID
          goalId: newGoal.id,
          currentLevel: 1,
          totalClicks: 0,
          levelPoints: 0,
          weeklyTarget: 50
        });
      }

      res.json({ success: true, goal: newGoal });
    } catch (error: any) {
      console.error("Goal creation error:", error);
      res.status(500).json({ message: "Failed to create goal" });
    }
  });

  // Get all available goals
  app.get("/api/goals", async (req, res) => {
    try {
      const goals = await storage.getAllGoals();
      res.json(goals);
    } catch (error) {
      res.status(500).json({ message: "Failed to get goals" });
    }
  });

  // Get player's goals with level decay calculation
  app.get("/api/player/goals", async (req, res) => {
    try {
      const playerId = 1; // For now, using default player
      
      // Get weekly and daily averages for threshold calculation
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 30);
      
      const records = await storage.getAllClickRecords();
      const totalClicks = records.reduce((sum, record) => sum + record.clicks, 0);
      const daysActive = records.filter(record => record.clicks > 0).length;
      const weeklyAverage = totalClicks / 4.3; // ~30 days / 7
      const dailyAverage = daysActive > 0 ? totalClicks / daysActive : 0;

      // Initialize default goals if none exist
      const existingGoals = await storage.getPlayerGoals(playerId);
      
      if (existingGoals.length === 0) {
        // Create default goals for new players
        for (const goal of Object.values(BASKETBALL_GOALS)) {
          const weeklyTarget = calculateWeeklyTarget(weeklyAverage, dailyAverage);
          await storage.createPlayerGoal({
            playerId,
            goalId: goal.id,
            currentLevel: 1,
            totalClicks: 0,
            levelPoints: 0,
            weeklyTarget: Math.round(weeklyTarget),
            lastActivityDate: null
          });
        }
      }

      // Get updated goals and apply level decay
      const playerGoals = await storage.getPlayerGoals(playerId);
      const updatedGoals = [];

      for (const playerGoal of playerGoals) {
        const { newPoints, daysInactive, pointsLost } = calculateLevelDecay(
          playerGoal.lastActivityDate,
          playerGoal.levelPoints || 0,
          weeklyAverage,
          dailyAverage
        );

        const oldLevel = calculateLevelFromPoints(playerGoal.levelPoints || 0);
        const newLevel = calculateLevelFromPoints(newPoints);

        if (pointsLost > 0) {
          await storage.updatePlayerGoal(playerGoal.id, {
            levelPoints: newPoints,
            currentLevel: newLevel
          });
        }

        const goalData = Object.values(BASKETBALL_GOALS).find(g => g.id === playerGoal.goalId);
        
        updatedGoals.push({
          ...playerGoal,
          levelPoints: newPoints,
          currentLevel: newLevel,
          goal: goalData,
          category: goalData ? GOAL_CATEGORIES[goalData.category as keyof typeof GOAL_CATEGORIES] : null,
          decayInfo: { daysInactive, pointsLost },
          progressMessage: pointsLost > 0 ? getGoalProgressMessage(goalData, oldLevel, newLevel) : null
        });
      }

      res.json(updatedGoals);
    } catch (error) {
      console.error("Get player goals error:", error);
      res.status(500).json({ message: "Failed to get player goals" });
    }
  });

  // Track clicks for a specific goal
  app.post("/api/goals/:goalId/click", async (req, res) => {
    try {
      console.log("Goal click endpoint hit for goalId:", req.params.goalId);
      const goalId = parseInt(req.params.goalId);
      const today = new Date().toISOString().split('T')[0];
      
      console.log("Processing click for goal:", goalId, "on date:", today);

      // Increment overall daily clicks for home counter
      let clickRecord = await storage.getClickRecordByDate(today);
      console.log("Current click record:", clickRecord);
      
      if (clickRecord) {
        clickRecord = await storage.updateClickRecord(today, clickRecord.clicks + 1);
        console.log("Updated click record:", clickRecord);
      } else {
        clickRecord = await storage.createClickRecord({ date: today, clicks: 1 });
        console.log("Created new click record:", clickRecord);
      }

      // Update player profile total clicks
      const profile = await storage.getPlayerProfile();
      console.log("Current profile:", profile);
      
      if (profile) {
        const updatedProfile = await storage.updatePlayerProfile({
          totalClicks: profile.totalClicks + 1
        });
        console.log("Updated profile:", updatedProfile);
      }

      console.log("Successfully processed goal click");
      res.json({
        success: true,
        goalId,
        message: "Goal training click recorded successfully"
      });
    } catch (error: any) {
      console.error("Goal click error:", error);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      res.status(500).json({ message: "Failed to record goal click" });
    }
  });

  // Decrement goal-specific click
  app.post("/api/goals/:goalId/decrement", async (req, res) => {
    try {
      const goalId = parseInt(req.params.goalId);
      const today = new Date().toISOString().split('T')[0];

      // Decrement goal-specific click record
      let goalClickRecord = await storage.getGoalClickRecord(1, goalId, today);
      
      if (goalClickRecord && goalClickRecord.clicks > 0) {
        goalClickRecord = await storage.updateGoalClickRecord(goalClickRecord.id, goalClickRecord.clicks - 1);
      }

      // Update player goal progress (decrease points and possibly level)
      const playerGoal = await storage.getPlayerGoal(1, goalId);
      if (playerGoal && playerGoal.totalClicks > 0) {
        await storage.updatePlayerGoal(playerGoal.id, {
          totalClicks: Math.max(0, playerGoal.totalClicks - 1),
          levelPoints: Math.max(0, playerGoal.levelPoints - 1)
        });
      }

      // Decrement overall daily clicks for home counter
      let clickRecord = await storage.getClickRecordByDate(today);
      
      if (clickRecord && clickRecord.clicks > 0) {
        clickRecord = await storage.updateClickRecord(today, clickRecord.clicks - 1);
      }

      // Update player profile total clicks
      const profile = await storage.getPlayerProfile();
      
      if (profile && profile.totalClicks > 0) {
        await storage.updatePlayerProfile({
          totalClicks: Math.max(0, profile.totalClicks - 1)
        });
      }

      res.json({
        success: true,
        goalId,
        message: "Goal training click decremented successfully"
      });
    } catch (error: any) {
      console.error("Goal decrement error:", error);
      res.status(500).json({ message: "Failed to decrement goal click" });
    }
  });

  // Get goal statistics
  app.get("/api/goals/:goalId/stats", async (req, res) => {
    try {
      const goalId = parseInt(req.params.goalId);
      const playerId = 1;
      
      // Get last 7 days of data
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 6);
      
      const records = await storage.getGoalClickRecords(
        playerId,
        goalId,
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );

      const playerGoal = await storage.getPlayerGoal(playerId, goalId);
      const goalData = Object.values(BASKETBALL_GOALS).find(g => g.id === goalId);

      // Calculate weekly progress
      const weeklyClicks = records.reduce((sum, record) => sum + (record.clicks || 0), 0);
      const weeklyTarget = playerGoal?.weeklyTarget || 0;
      const progressPercentage = weeklyTarget > 0 ? (weeklyClicks / weeklyTarget) * 100 : 0;

      // Prepare daily data for chart
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

      res.json({
        goal: goalData,
        playerGoal,
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

  // Switch active goal
  app.post("/api/player/active-goal", async (req, res) => {
    try {
      const { goalId } = req.body;
      
      if (!goalId) {
        return res.status(400).json({ message: "Goal ID is required" });
      }

      const goalData = Object.values(BASKETBALL_GOALS).find(g => g.id === goalId);
      
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

  // Update goal name
  app.patch("/api/goals/:goalId", async (req, res) => {
    try {
      const goalId = parseInt(req.params.goalId);
      const { name } = req.body;
      
      if (!name || name.trim().length === 0) {
        return res.status(400).json({ message: "Name is required" });
      }

      // Update goal in database
      const updatedGoal = await storage.updateGoal(goalId, { name: name.trim() });
      
      res.json({ success: true, goal: updatedGoal });
    } catch (error) {
      console.error("Goal update error:", error);
      res.status(500).json({ message: "Failed to update goal" });
    }
  });

  // Delete goal
  app.delete("/api/goals/:goalId", async (req, res) => {
    try {
      const goalId = parseInt(req.params.goalId);
      
      // First check if goal exists
      const goals = await storage.getAllGoals();
      const goalExists = goals.find(g => g.id === goalId);
      
      if (!goalExists) {
        return res.status(404).json({ message: "Goal not found" });
      }

      // Delete player goals first (foreign key constraint)
      const playerGoals = await storage.getPlayerGoals(1);
      const playerGoal = playerGoals.find(pg => pg.goalId === goalId);
      
      if (playerGoal) {
        await storage.deletePlayerGoal(playerGoal.id);
      }
      
      // Then delete the goal
      await storage.deleteGoal(goalId);
      
      res.json({ success: true, message: "Goal deleted successfully" });
    } catch (error: any) {
      console.error("Goal deletion error:", error);
      res.status(500).json({ message: "Failed to delete goal" });
    }
  });
}