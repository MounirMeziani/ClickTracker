/**
 * DATABASE SCHEMA DEFINITIONS
 * 
 * This file defines the complete database schema using Drizzle ORM for PostgreSQL.
 * All tables, relationships, and type definitions are centralized here.
 * 
 * DEPENDENCIES:
 * - drizzle-orm: ORM for type-safe database operations
 * - drizzle-zod: Schema validation integration with Zod
 * - zod: Runtime type validation
 * 
 * ARCHITECTURE NOTE:
 * This schema supports a basketball-themed productivity app with:
 * - User management and authentication
 * - Click tracking (daily productivity metrics)
 * - Gamification (levels, skins, achievements)
 * - Goal system with independent tracking per goal
 * - Team collaboration features
 * - Daily challenges system
 */
import { pgTable, serial, text, varchar, integer, timestamp, date, boolean, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/**
 * USERS TABLE
 * Core user authentication and identification
 * Used for login/registration (currently simplified, no real auth system)
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username").unique().notNull(),
  password: text("password").notNull(), // NOTE: In production, this should be hashed
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * CLICK RECORDS TABLE
 * Tracks overall daily click activity across all goals
 * Used for general statistics and the main home page analytics
 * NOTE: This is separate from goal-specific click tracking
 */
export const clickRecords = pgTable("click_records", {
  id: serial("id").primaryKey(),
  date: date("date").notNull().unique(), // One record per day
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

/**
 * GOALS TABLE - Core Feature
 * Represents individual productivity goals that users can create and track
 * 
 * IMPORTANT: Goals work like "swappable CDs" - only one can be active at a time
 * Each goal has independent click tracking and progression
 * 
 * FEATURES:
 * - Users can create multiple goals with custom names/descriptions
 * - Only one goal can be active (receiving clicks) at any time
 * - Each goal tracks its own level progression and statistics
 * - Goals can be edited, deleted, and swapped between
 */
export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull(), // References users.id
  name: varchar("name", { length: 255 }).notNull(), // User-customizable goal name
  description: text("description"), // User-customizable description
  category: varchar("category", { length: 100 }).default("general"), // Categories like "productivity", "learning"
  isActive: boolean("is_active").default(false), // Only one goal can be active per user
  totalClicks: integer("total_clicks").default(0), // Cumulative clicks for this goal
  currentLevel: integer("current_level").default(1), // Goal-specific level progression
  levelPoints: integer("level_points").default(0), // Points toward next level
  weeklyTarget: integer("weekly_target").default(100), // Target clicks per week
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