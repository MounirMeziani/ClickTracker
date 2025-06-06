import { pgTable, text, varchar, serial, integer, date, timestamp, boolean, json } from "drizzle-orm/pg-core";
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

export const insertDailyActivitySchema = createInsertSchema(dailyActivity).pick({
  playerId: true,
  teamId: true,
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
export type Team = typeof teams.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
export type TeamActivity = typeof teamActivity.$inferSelect;
export type InsertTeamActivity = z.infer<typeof insertTeamActivitySchema>;
export type DailyActivity = typeof dailyActivity.$inferSelect;
export type InsertDailyActivity = z.infer<typeof insertDailyActivitySchema>;
  inviteeEmail: text("invitee_email"),
  inviteCode: text("invite_code").unique().notNull(),
  status: text("status").default("pending"), // pending, accepted, expired
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  usedAt: timestamp("used_at"),
});

// Team schemas
export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
  inviteCode: true,
  memberCount: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTeamMemberSchema = createInsertSchema(teamMembers).omit({
  id: true,
  joinedAt: true,
});

export const insertInviteSchema = createInsertSchema(invites).omit({
  id: true,
  inviteCode: true,
  status: true,
  createdAt: true,
  usedAt: true,
});

// Team types
export type Team = typeof teams.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
export type Invite = typeof invites.$inferSelect;
export type InsertInvite = z.infer<typeof insertInviteSchema>;
