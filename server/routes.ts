import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertClickRecordSchema, updateClickRecordSchema } from "@shared/schema";
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

  // Increment today's click count
  app.post("/api/clicks/increment", async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const existingRecord = await storage.getClickRecordByDate(today);
      
      let record;
      if (existingRecord) {
        record = await storage.updateClickRecord(today, existingRecord.clicks + 1);
      } else {
        record = await storage.createClickRecord({ date: today, clicks: 1 });
      }
      
      res.json(record);
    } catch (error) {
      res.status(500).json({ message: "Failed to increment clicks" });
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

  const httpServer = createServer(app);
  return httpServer;
}
