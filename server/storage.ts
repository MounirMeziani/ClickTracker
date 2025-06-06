import { users, clickRecords, type User, type InsertUser, type ClickRecord, type InsertClickRecord, type UpdateClickRecord } from "@shared/schema";
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
}

export const storage = new DatabaseStorage();
