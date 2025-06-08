import { 
  users, 
  clickRecords, 
  playerProfile, 
  dailyChallenges,
  goals,
  goalClickRecords,
  type User, 
  type InsertUser, 
  type ClickRecord, 
  type InsertClickRecord, 
  type UpdateClickRecord,
  type PlayerProfile,
  type InsertPlayerProfile,
  type DailyChallenge,
  type InsertDailyChallenge,
  type Goal,
  type InsertGoal,
  type GoalClickRecord,
  type InsertGoalClickRecord,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

// Clean storage interface for the new goals system
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Click record methods
  getClickRecordByDate(date: string): Promise<ClickRecord | undefined>;
  createClickRecord(record: InsertClickRecord): Promise<ClickRecord>;
  updateClickRecord(date: string, clicks: number): Promise<ClickRecord>;
  getAllClickRecords(): Promise<ClickRecord[]>;
  getClickRecordsInRange(startDate: string, endDate: string): Promise<ClickRecord[]>;
  
  // Player profile methods
  getPlayerProfile(): Promise<PlayerProfile | undefined>;
  createPlayerProfile(profile: InsertPlayerProfile): Promise<PlayerProfile>;
  updatePlayerProfile(updates: Partial<PlayerProfile>): Promise<PlayerProfile>;
  
  // Daily challenge methods
  getDailyChallengeByDate(date: string): Promise<DailyChallenge | undefined>;
  createDailyChallenge(challenge: InsertDailyChallenge): Promise<DailyChallenge>;
  getAllDailyChallenges(): Promise<DailyChallenge[]>;
  
  // Goals - simplified system
  getGoals(playerId: number): Promise<Goal[]>;
  getGoal(id: number): Promise<Goal | undefined>;
  getActiveGoal(playerId: number): Promise<Goal | undefined>;
  createGoal(goal: InsertGoal): Promise<Goal>;
  updateGoal(id: number, updates: Partial<Goal>): Promise<Goal>;
  deleteGoal(id: number): Promise<void>;
  setActiveGoal(playerId: number, goalId: number): Promise<void>;
  
  // Goal click tracking
  getGoalClickRecord(goalId: number, date: string): Promise<GoalClickRecord | undefined>;
  createGoalClickRecord(record: InsertGoalClickRecord): Promise<GoalClickRecord>;
  updateGoalClickRecord(id: number, clicks: number): Promise<GoalClickRecord>;
  getGoalClickRecords(goalId: number, startDate: string, endDate: string): Promise<GoalClickRecord[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Click record methods
  async getClickRecordByDate(date: string): Promise<ClickRecord | undefined> {
    const [record] = await db.select().from(clickRecords).where(eq(clickRecords.date, date));
    return record;
  }

  async createClickRecord(insertRecord: InsertClickRecord): Promise<ClickRecord> {
    const [record] = await db.insert(clickRecords).values(insertRecord).returning();
    return record;
  }

  async updateClickRecord(date: string, clicks: number): Promise<ClickRecord> {
    const [record] = await db.update(clickRecords)
      .set({ clicks, updatedAt: new Date() })
      .where(eq(clickRecords.date, date))
      .returning();
    return record;
  }

  async getAllClickRecords(): Promise<ClickRecord[]> {
    return await db.select().from(clickRecords).orderBy(desc(clickRecords.date));
  }

  async getClickRecordsInRange(startDate: string, endDate: string): Promise<ClickRecord[]> {
    return await db.select()
      .from(clickRecords)
      .where(and(
        eq(clickRecords.date, startDate),
        eq(clickRecords.date, endDate)
      ))
      .orderBy(desc(clickRecords.date));
  }

  // Player profile methods
  async getPlayerProfile(): Promise<PlayerProfile | undefined> {
    const [profile] = await db.select().from(playerProfile).limit(1);
    return profile;
  }

  async createPlayerProfile(profile: InsertPlayerProfile): Promise<PlayerProfile> {
    const [newProfile] = await db.insert(playerProfile).values(profile).returning();
    return newProfile;
  }

  async updatePlayerProfile(updates: Partial<PlayerProfile>): Promise<PlayerProfile> {
    const [profile] = await db.update(playerProfile)
      .set({ ...updates, updatedAt: new Date() })
      .returning();
    return profile;
  }

  // Daily challenge methods
  async getDailyChallengeByDate(date: string): Promise<DailyChallenge | undefined> {
    const [challenge] = await db.select().from(dailyChallenges).where(eq(dailyChallenges.date, date));
    return challenge;
  }

  async createDailyChallenge(challenge: InsertDailyChallenge): Promise<DailyChallenge> {
    const [newChallenge] = await db.insert(dailyChallenges).values(challenge).returning();
    return newChallenge;
  }

  async getAllDailyChallenges(): Promise<DailyChallenge[]> {
    return await db.select().from(dailyChallenges).orderBy(desc(dailyChallenges.date));
  }

  // Clean goals system
  async getGoals(playerId: number): Promise<Goal[]> {
    return await db.select().from(goals)
      .where(eq(goals.playerId, playerId))
      .orderBy(desc(goals.isActive), desc(goals.createdAt));
  }

  async getGoal(id: number): Promise<Goal | undefined> {
    const [goal] = await db.select().from(goals).where(eq(goals.id, id));
    return goal;
  }

  async getActiveGoal(playerId: number): Promise<Goal | undefined> {
    const [goal] = await db.select().from(goals)
      .where(and(eq(goals.playerId, playerId), eq(goals.isActive, true)));
    return goal;
  }

  async createGoal(goal: InsertGoal): Promise<Goal> {
    const [newGoal] = await db.insert(goals).values(goal).returning();
    return newGoal;
  }

  async updateGoal(id: number, updates: Partial<Goal>): Promise<Goal> {
    const [goal] = await db.update(goals)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(goals.id, id))
      .returning();
    return goal;
  }

  async deleteGoal(id: number): Promise<void> {
    await db.delete(goals).where(eq(goals.id, id));
  }

  async setActiveGoal(playerId: number, goalId: number): Promise<void> {
    // First, deactivate all goals for this player
    await db.update(goals)
      .set({ isActive: false })
      .where(eq(goals.playerId, playerId));
    
    // Then activate the selected goal
    await db.update(goals)
      .set({ isActive: true })
      .where(eq(goals.id, goalId));
  }

  // Goal click tracking
  async getGoalClickRecord(goalId: number, date: string): Promise<GoalClickRecord | undefined> {
    const [record] = await db.select().from(goalClickRecords)
      .where(and(eq(goalClickRecords.goalId, goalId), eq(goalClickRecords.date, date)));
    return record;
  }

  async createGoalClickRecord(record: InsertGoalClickRecord): Promise<GoalClickRecord> {
    const [newRecord] = await db.insert(goalClickRecords).values(record).returning();
    return newRecord;
  }

  async updateGoalClickRecord(id: number, clicks: number): Promise<GoalClickRecord> {
    const [record] = await db.update(goalClickRecords)
      .set({ clicks, updatedAt: new Date() })
      .where(eq(goalClickRecords.id, id))
      .returning();
    return record;
  }

  async getGoalClickRecords(goalId: number, startDate: string, endDate: string): Promise<GoalClickRecord[]> {
    return await db.select().from(goalClickRecords)
      .where(and(
        eq(goalClickRecords.goalId, goalId),
        // Add date range filtering logic here
      ))
      .orderBy(desc(goalClickRecords.date));
  }
}

export const storage = new DatabaseStorage();