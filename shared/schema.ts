import { pgTable, serial, text, varchar, integer, timestamp, date, boolean, unique } from "drizzle-orm/pg-core";
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
  ownerId: integer("owner_id").notNull().references(() => users.id),
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

export const teamInvites = pgTable("team_invites", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  inviteCode: varchar("invite_code", { length: 20 }).notNull().unique(),
  inviterUserId: integer("inviter_user_id").notNull().references(() => users.id),
  inviteeEmail: varchar("invitee_email", { length: 255 }),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, accepted, expired
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Clean goals system - each goal is independent
export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull(), // Each goal belongs to a player
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }).default("general"),
  isActive: boolean("is_active").default(false), // Only one active goal per player
  totalClicks: integer("total_clicks").default(0),
  currentLevel: integer("current_level").default(1),
  levelPoints: integer("level_points").default(0),
  weeklyTarget: integer("weekly_target").default(100),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const goalClickRecords = pgTable("goal_click_records", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull(),
  goalId: integer("goal_id").notNull().references(() => goals.id, { onDelete: "cascade" }),
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
  ownerId: true,
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
  playerId: true,
  name: true,
  description: true,
  category: true,
  weeklyTarget: true,
});

export const insertGoalClickRecordSchema = createInsertSchema(goalClickRecords).pick({
  goalId: true,
  date: true,
  clicks: true,
});

export const insertTeamInviteSchema = createInsertSchema(teamInvites).pick({
  teamId: true,
  inviteCode: true,
  inviterUserId: true,
  inviteeEmail: true,
  expiresAt: true,
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
export type GoalClickRecord = typeof goalClickRecords.$inferSelect;
export type InsertGoalClickRecord = z.infer<typeof insertGoalClickRecordSchema>;
export type TeamInvite = typeof teamInvites.$inferSelect;
export type InsertTeamInvite = z.infer<typeof insertTeamInviteSchema>;