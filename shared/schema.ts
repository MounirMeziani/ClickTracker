import { pgTable, serial, text, varchar, integer, timestamp, date, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username").unique().notNull(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const clickRecords = pgTable("click_records", {
  id: serial("id").primaryKey(),
  date: date("date").notNull().unique(),
  clicks: integer("clicks").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const playerProfile = pgTable("player_profile", {
  id: serial("id").primaryKey(),
  currentLevel: integer("current_level").notNull().default(1),
  totalClicks: integer("total_clicks").notNull().default(0),
  currentSkin: text("current_skin").notNull().default("rookie"),
  unlockedSkins: text("unlocked_skins").array().notNull().default(['rookie']),
  achievements: text("achievements").array().notNull().default([]),
  dailyChallengeCompleted: boolean("daily_challenge_completed").notNull().default(false),
  lastChallengeDate: date("last_challenge_date"),
  streakCount: integer("streak_count").notNull().default(0),
  teamId: integer("team_id"), // Reference to team
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

export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),
  maxMembers: integer("max_members").notNull().default(10),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull(),
  playerId: integer("player_id").notNull(),
  role: text("role").notNull().default("member"), // member, captain, coach
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
});

export const teamActivity = pgTable("team_activity", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull(),
  playerId: integer("player_id").notNull(),
  activityType: text("activity_type").notNull(), // level_up, achievement, milestone
  description: text("description").notNull(),
  date: date("date").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }).notNull(),
  maxLevel: integer("max_level").default(12),
  createdAt: timestamp("created_at").defaultNow(),
});

export const playerGoals = pgTable("player_goals", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull(),
  goalId: integer("goal_id").notNull().references(() => goals.id),
  currentLevel: integer("current_level").default(1),
  totalClicks: integer("total_clicks").default(0),
  currentSkin: varchar("current_skin", { length: 50 }).default("rookie"),
  unlockedSkins: text("unlocked_skins").array().default([]),
  achievements: text("achievements").array().default([]),
  streakCount: integer("streak_count").default(0),
  dailyChallengeCompleted: boolean("daily_challenge_completed").default(false),
  lastChallengeDate: varchar("last_challenge_date"),
  lastActivityDate: varchar("last_activity_date"),
  weeklyTarget: integer("weekly_target").default(0),
  levelPoints: integer("level_points").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const goalClickRecords = pgTable("goal_click_records", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull(),
  goalId: integer("goal_id").notNull().references(() => goals.id),
  date: varchar("date", { length: 10 }).notNull(),
  clicks: integer("clicks").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
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
  teamId: true,
});

export const insertDailyChallengeSchema = createInsertSchema(dailyChallenges).pick({
  date: true,
  challengeType: true,
  targetValue: true,
  description: true,
  reward: true,
});

export const insertTeamSchema = createInsertSchema(teams).pick({
  name: true,
  description: true,
  maxMembers: true,
});

export const insertTeamMemberSchema = createInsertSchema(teamMembers).pick({
  teamId: true,
  playerId: true,
  role: true,
});

export const insertTeamActivitySchema = createInsertSchema(teamActivity).pick({
  teamId: true,
  playerId: true,
  activityType: true,
  description: true,
  date: true,
});

export const insertGoalSchema = createInsertSchema(goals).pick({
  name: true,
  description: true,
  category: true,
  maxLevel: true,
});

export const insertPlayerGoalSchema = createInsertSchema(playerGoals).pick({
  playerId: true,
  goalId: true,
  currentLevel: true,
  totalClicks: true,
  currentSkin: true,
  unlockedSkins: true,
  achievements: true,
  streakCount: true,
  dailyChallengeCompleted: true,
  lastChallengeDate: true,
  lastActivityDate: true,
  weeklyTarget: true,
  levelPoints: true,
});

export const insertGoalClickRecordSchema = createInsertSchema(goalClickRecords).pick({
  playerId: true,
  goalId: true,
  date: true,
  clicks: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type ClickRecord = typeof clickRecords.$inferSelect;
export type InsertClickRecord = z.infer<typeof insertClickRecordSchema>;
export type UpdateClickRecord = z.infer<typeof updateClickRecordSchema>;
export type PlayerProfile = typeof playerProfile.$inferSelect;
export type InsertPlayerProfile = z.infer<typeof insertPlayerProfileSchema>;
export type DailyChallenge = typeof dailyChallenges.$inferSelect;
export type InsertDailyChallenge = z.infer<typeof insertDailyChallengeSchema>;
export type Team = typeof teams.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
export type TeamActivity = typeof teamActivity.$inferSelect;
export type InsertTeamActivity = z.infer<typeof insertTeamActivitySchema>;
export type Goal = typeof goals.$inferSelect;
export type InsertGoal = z.infer<typeof insertGoalSchema>;
export type PlayerGoal = typeof playerGoals.$inferSelect;
export type InsertPlayerGoal = z.infer<typeof insertPlayerGoalSchema>;
export type GoalClickRecord = typeof goalClickRecords.$inferSelect;
export type InsertGoalClickRecord = z.infer<typeof insertGoalClickRecordSchema>;