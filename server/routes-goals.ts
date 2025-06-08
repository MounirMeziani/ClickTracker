import type { Express } from "express";
import { storage } from "./storage";
import { insertGoalSchema } from "@shared/schema";
import { calculateLevelFromPoints } from "./goalSystem";

const PLAYER_ID = 1; // Hardcoded for single-player mode

export function registerGoalRoutes(app: Express) {
  // Get all goals for the player
  app.get("/api/goals", async (req, res) => {
    try {
      console.log("=== GET GOALS START ===");
      const goals = await storage.getGoals(PLAYER_ID);
      console.log("Found goals:", goals);
      res.json(goals);
    } catch (error) {
      console.error("Error fetching goals:", error);
      res.status(500).json({ message: "Failed to fetch goals" });
    }
  });

  // Get active goal
  app.get("/api/goals/active", async (req, res) => {
    try {
      console.log("=== GET ACTIVE GOAL START ===");
      const activeGoal = await storage.getActiveGoal(PLAYER_ID);
      console.log("Active goal:", activeGoal);
      res.json(activeGoal || null);
    } catch (error) {
      console.error("Error fetching active goal:", error);
      res.status(500).json({ message: "Failed to fetch active goal" });
    }
  });

  // Create a new goal
  app.post("/api/goals", async (req, res) => {
    try {
      console.log("=== CREATE GOAL START ===");
      console.log("Request body:", req.body);
      
      const goalData = {
        ...req.body,
        playerId: PLAYER_ID,
        isActive: false, // New goals start inactive
      };
      
      console.log("Creating goal with data:", goalData);
      const newGoal = await storage.createGoal(goalData);
      console.log("Created goal:", newGoal);
      
      res.json(newGoal);
    } catch (error) {
      console.error("Error creating goal:", error);
      res.status(500).json({ message: "Failed to create goal" });
    }
  });

  // Update a goal (including name changes)
  app.patch("/api/goals/:id", async (req, res) => {
    try {
      console.log("=== UPDATE GOAL START ===");
      const goalId = parseInt(req.params.id);
      console.log("Goal ID:", goalId);
      console.log("Update data:", req.body);
      
      const updatedGoal = await storage.updateGoal(goalId, req.body);
      console.log("Updated goal:", updatedGoal);
      
      res.json(updatedGoal);
    } catch (error) {
      console.error("Error updating goal:", error);
      res.status(500).json({ message: "Failed to update goal" });
    }
  });

  // Delete a goal
  app.delete("/api/goals/:id", async (req, res) => {
    try {
      console.log("=== DELETE GOAL START ===");
      const goalId = parseInt(req.params.id);
      console.log("Deleting goal ID:", goalId);
      
      await storage.deleteGoal(goalId);
      console.log("Goal deleted successfully");
      
      res.json({ success: true, message: "Goal deleted" });
    } catch (error) {
      console.error("Error deleting goal:", error);
      res.status(500).json({ message: "Failed to delete goal" });
    }
  });

  // Set active goal
  app.post("/api/goals/:id/activate", async (req, res) => {
    try {
      console.log("=== ACTIVATE GOAL START ===");
      const goalId = parseInt(req.params.id);
      console.log("Activating goal ID:", goalId);
      
      await storage.setActiveGoal(PLAYER_ID, goalId);
      console.log("Goal activated successfully");
      
      const activeGoal = await storage.getGoal(goalId);
      res.json({ success: true, activeGoal });
    } catch (error) {
      console.error("Error activating goal:", error);
      res.status(500).json({ message: "Failed to activate goal" });
    }
  });

  // Track clicks for a specific goal
  app.post("/api/goals/:id/click", async (req, res) => {
    try {
      console.log("=== GOAL CLICK INCREMENT START ===");
      const goalId = parseInt(req.params.id);
      const today = new Date().toISOString().split('T')[0];
      console.log("Goal ID:", goalId, "Date:", today);

      // Update the overall daily clicks counter
      let clickRecord = await storage.getClickRecordByDate(today);
      if (clickRecord) {
        clickRecord = await storage.updateClickRecord(today, clickRecord.clicks + 1);
      } else {
        clickRecord = await storage.createClickRecord({ date: today, clicks: 1 });
      }
      console.log("Updated overall clicks:", clickRecord.clicks);

      // Update goal-specific clicks
      let goalClickRecord = await storage.getGoalClickRecord(goalId, today);
      if (goalClickRecord) {
        goalClickRecord = await storage.updateGoalClickRecord(goalClickRecord.id, goalClickRecord.clicks + 1);
      } else {
        goalClickRecord = await storage.createGoalClickRecord({
          goalId,
          date: today,
          clicks: 1
        });
      }
      console.log("Updated goal clicks:", goalClickRecord.clicks);

      // Update goal totals and level
      const goal = await storage.getGoal(goalId);
      if (goal) {
        const newTotalClicks = (goal.totalClicks || 0) + 1;
        const newLevelPoints = (goal.levelPoints || 0) + 1;
        const newLevel = calculateLevelFromPoints(newLevelPoints);
        
        await storage.updateGoal(goalId, {
          totalClicks: newTotalClicks,
          levelPoints: newLevelPoints,
          currentLevel: newLevel
        });
        console.log("Updated goal totals - clicks:", newTotalClicks, "level:", newLevel);
      }

      // Update player profile
      const profile = await storage.getPlayerProfile();
      if (profile) {
        await storage.updatePlayerProfile({
          totalClicks: (profile.totalClicks || 0) + 1
        });
      }

      res.json({ 
        success: true, 
        goalId,
        totalClicks: goalClickRecord.clicks,
        message: "Goal click recorded successfully" 
      });
    } catch (error) {
      console.error("Error recording goal click:", error);
      res.status(500).json({ message: "Failed to record goal click" });
    }
  });

  // Decrement clicks for a specific goal
  app.post("/api/goals/:id/decrement", async (req, res) => {
    try {
      console.log("=== GOAL CLICK DECREMENT START ===");
      const goalId = parseInt(req.params.id);
      const today = new Date().toISOString().split('T')[0];
      console.log("Goal ID:", goalId, "Date:", today);

      // Check if we have any overall clicks to decrement from
      let clickRecord = await storage.getClickRecordByDate(today);
      const hasOverallClicks = clickRecord && (clickRecord.clicks || 0) > 0;
      console.log("Current daily clicks:", clickRecord?.clicks || 0, "Has overall clicks:", hasOverallClicks);
      
      if (hasOverallClicks) {
        // Always update overall daily clicks first
        clickRecord = await storage.updateClickRecord(today, Math.max(0, clickRecord.clicks - 1));
        console.log("Decremented overall daily clicks to:", clickRecord.clicks);

        // Update player profile
        const profile = await storage.getPlayerProfile();
        if (profile && (profile.totalClicks || 0) > 0) {
          await storage.updatePlayerProfile({
            totalClicks: Math.max(0, (profile.totalClicks || 0) - 1)
          });
          console.log("Decremented player profile total clicks");
        }

        // Update goal-specific clicks if available
        let goalClickRecord = await storage.getGoalClickRecord(goalId, today);
        if (goalClickRecord && (goalClickRecord.clicks || 0) > 0) {
          const newClicks = Math.max(0, (goalClickRecord.clicks || 0) - 1);
          goalClickRecord = await storage.updateGoalClickRecord(goalClickRecord.id, newClicks);
          console.log("Decremented goal clicks to:", newClicks);
        }
        
        // Update goal totals if available
        const goal = await storage.getGoal(goalId);
        if (goal && (goal.totalClicks || 0) > 0) {
          const newTotalClicks = Math.max(0, (goal.totalClicks || 0) - 1);
          const newLevelPoints = Math.max(0, (goal.levelPoints || 0) - 1);
          const newLevel = calculateLevelFromPoints(newLevelPoints);
          
          await storage.updateGoal(goalId, {
            totalClicks: newTotalClicks,
            levelPoints: newLevelPoints,
            currentLevel: newLevel
          });
          console.log("Updated goal totals - clicks:", newTotalClicks, "level:", newLevel);
        }
      } else {
        console.log("No overall clicks to decrement");
      }

      res.json({ 
        success: true, 
        goalId,
        message: "Goal click decremented successfully" 
      });
    } catch (error) {
      console.error("Error decrementing goal click:", error);
      res.status(500).json({ message: "Failed to decrement goal click" });
    }
  });

  // Get goal-specific analytics
  app.get("/api/goals/:id/analytics", async (req, res) => {
    try {
      console.log("=== GET GOAL ANALYTICS START ===");
      const goalId = parseInt(req.params.id);
      const today = new Date().toISOString().split('T')[0];
      
      const goal = await storage.getGoal(goalId);
      const todayRecord = await storage.getGoalClickRecord(goalId, today);
      
      const analytics = {
        goal,
        todayClicks: todayRecord?.clicks || 0,
        totalClicks: goal?.totalClicks || 0,
        currentLevel: goal?.currentLevel || 1,
        levelPoints: goal?.levelPoints || 0,
      };
      
      console.log("Goal analytics:", analytics);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching goal analytics:", error);
      res.status(500).json({ message: "Failed to fetch goal analytics" });
    }
  });

  // Get today's clicks for active goal
  app.get("/api/goals/active/today", async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const activeGoal = await storage.getActiveGoal(PLAYER_ID);
      
      if (!activeGoal) {
        return res.json({ clicks: 0, date: today });
      }
      
      const goalClickRecord = await storage.getGoalClickRecord(activeGoal.id, today);
      
      res.json({
        clicks: goalClickRecord?.clicks || 0,
        date: today,
        goalId: activeGoal.id,
        goalName: activeGoal.name
      });
    } catch (error) {
      console.error("Error getting active goal today clicks:", error);
      res.status(500).json({ message: "Failed to get today's goal clicks" });
    }
  });

  // Get last 7 days for active goal
  app.get("/api/goals/active/last-7-days", async (req, res) => {
    try {
      const activeGoal = await storage.getActiveGoal(PLAYER_ID);
      
      if (!activeGoal) {
        return res.json([]);
      }

      const last7DaysData = [];
      const today = new Date();
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateString = date.toISOString().split('T')[0];
        
        const goalClickRecord = await storage.getGoalClickRecord(activeGoal.id, dateString);
        
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const isToday = i === 0;
        
        last7DaysData.push({
          date: dateString,
          clicks: goalClickRecord?.clicks || 0,
          dayName: dayNames[date.getDay()],
          shortDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          isToday
        });
      }
      
      res.json(last7DaysData);
    } catch (error) {
      console.error("Error fetching active goal last 7 days:", error);
      res.status(500).json({ message: "Failed to fetch goal last 7 days data" });
    }
  });
}