import { 
  users, 
  clickRecords, 
  playerProfile, 
  dailyChallenges,
  type User, 
  type InsertUser, 
  type ClickRecord, 
  type InsertClickRecord, 
  type UpdateClickRecord,
  type PlayerProfile,
  type InsertPlayerProfile,
  type DailyChallenge,
  type InsertDailyChallenge
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc } from "drizzle-orm";

export interface IStorage {
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
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getClickRecordByDate(date: string): Promise<ClickRecord | undefined> {
    const [record] = await db.select().from(clickRecords).where(eq(clickRecords.date, date));
    return record || undefined;
  }

  async createClickRecord(insertRecord: InsertClickRecord): Promise<ClickRecord> {
    const [record] = await db
      .insert(clickRecords)
      .values(insertRecord)
      .returning();
    return record;
  }

  async updateClickRecord(date: string, clicks: number): Promise<ClickRecord> {
    const [record] = await db
      .update(clickRecords)
      .set({ clicks, updatedAt: new Date() })
      .where(eq(clickRecords.date, date))
      .returning();
    
    if (!record) {
      throw new Error(`Click record for date ${date} not found`);
    }
    
    return record;
  }

  async getAllClickRecords(): Promise<ClickRecord[]> {
    return await db.select().from(clickRecords).orderBy(desc(clickRecords.date));
  }

  async getClickRecordsInRange(startDate: string, endDate: string): Promise<ClickRecord[]> {
    return await db
      .select()
      .from(clickRecords)
      .where(
        and(
          gte(clickRecords.date, startDate),
          lte(clickRecords.date, endDate)
        )
      )
      .orderBy(desc(clickRecords.date));
  }

  async getPlayerProfile(): Promise<PlayerProfile | undefined> {
    const [profile] = await db.select().from(playerProfile).limit(1);
    return profile || undefined;
  }

  async createPlayerProfile(profile: InsertPlayerProfile): Promise<PlayerProfile> {
    const [newProfile] = await db
      .insert(playerProfile)
      .values(profile)
      .returning();
    return newProfile;
  }

  async updatePlayerProfile(updates: Partial<PlayerProfile>): Promise<PlayerProfile> {
    const [profile] = await db
      .update(playerProfile)
      .set({ ...updates, updatedAt: new Date() })
      .returning();
    
    if (!profile) {
      throw new Error("Player profile not found");
    }
    
    return profile;
  }

  async getDailyChallengeByDate(date: string): Promise<DailyChallenge | undefined> {
    const [challenge] = await db.select().from(dailyChallenges).where(eq(dailyChallenges.date, date));
    return challenge || undefined;
  }

  async createDailyChallenge(challenge: InsertDailyChallenge): Promise<DailyChallenge> {
    const [newChallenge] = await db
      .insert(dailyChallenges)
      .values(challenge)
      .returning();
    return newChallenge;
  }

  async getAllDailyChallenges(): Promise<DailyChallenge[]> {
    return await db.select().from(dailyChallenges).orderBy(desc(dailyChallenges.date));
  }
}

export const storage = new DatabaseStorage();
