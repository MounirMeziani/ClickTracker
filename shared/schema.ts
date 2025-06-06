import { pgTable, text, serial, integer, date, timestamp, boolean, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const clickRecords = pgTable("click_records", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  clicks: integer("clicks").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const playerProfile = pgTable("player_profile", {
  id: serial("id").primaryKey(),
  currentLevel: integer("current_level").notNull().default(1),
  totalClicks: integer("total_clicks").notNull().default(0),
  currentSkin: text("current_skin").notNull().default("rookie"),
  unlockedSkins: json("unlocked_skins").$type<string[]>().notNull().default(["rookie"]),
  achievements: json("achievements").$type<string[]>().notNull().default([]),
  dailyChallengeCompleted: boolean("daily_challenge_completed").notNull().default(false),
  lastChallengeDate: date("last_challenge_date"),
  streakCount: integer("streak_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const dailyChallenges = pgTable("daily_challenges", {
  id: serial("id").primaryKey(),
  date: date("date").notNull().unique(),
  challengeType: text("challenge_type").notNull(),
  targetValue: integer("target_value").notNull(),
  description: text("description").notNull(),
  reward: text("reward").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const friends = pgTable("friends", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  friendId: integer("friend_id").notNull(),
  status: text("status").notNull().default("pending"), // pending, accepted, blocked
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const dailyActivity = pgTable("daily_activity", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull(),
  date: date("date").notNull(),
  clickCount: integer("click_count").notNull().default(0),
  sessionsPlayed: integer("sessions_played").notNull().default(0),
  achievementsUnlocked: integer("achievements_unlocked").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertClickRecordSchema = createInsertSchema(clickRecords).pick({
  date: true,
  clicks: true,
});

export const updateClickRecordSchema = createInsertSchema(clickRecords).pick({
  clicks: true,
});

export const insertPlayerProfileSchema = createInsertSchema(playerProfile).pick({
  currentLevel: true,
  totalClicks: true,
  currentSkin: true,
});

export const insertDailyChallengeSchema = createInsertSchema(dailyChallenges).pick({
  date: true,
  challengeType: true,
  targetValue: true,
  description: true,
  reward: true,
});

export const insertFriendSchema = createInsertSchema(friends).pick({
  userId: true,
  friendId: true,
  status: true,
});

export const insertDailyActivitySchema = createInsertSchema(dailyActivity).pick({
  playerId: true,
  date: true,
  clickCount: true,
  sessionsPlayed: true,
  achievementsUnlocked: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type ClickRecord = typeof clickRecords.$inferSelect;
export type InsertClickRecord = z.infer<typeof insertClickRecordSchema>;
export type UpdateClickRecord = z.infer<typeof updateClickRecordSchema>;
export type PlayerProfile = typeof playerProfile.$inferSelect;
export type InsertPlayerProfile = z.infer<typeof insertPlayerProfileSchema>;
export type DailyChallenge = typeof dailyChallenges.$inferSelect;
export type InsertDailyChallenge = z.infer<typeof insertDailyChallengeSchema>;
export type Friend = typeof friends.$inferSelect;
export type InsertFriend = z.infer<typeof insertFriendSchema>;
export type DailyActivity = typeof dailyActivity.$inferSelect;
export type InsertDailyActivity = z.infer<typeof insertDailyActivitySchema>;
