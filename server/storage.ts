import { users, clickRecords, type User, type InsertUser, type ClickRecord, type InsertClickRecord, type UpdateClickRecord } from "@shared/schema";

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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private clickRecords: Map<string, ClickRecord>;
  private currentUserId: number;
  private currentClickId: number;

  constructor() {
    this.users = new Map();
    this.clickRecords = new Map();
    this.currentUserId = 1;
    this.currentClickId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getClickRecordByDate(date: string): Promise<ClickRecord | undefined> {
    return this.clickRecords.get(date);
  }

  async createClickRecord(insertRecord: InsertClickRecord): Promise<ClickRecord> {
    const id = this.currentClickId++;
    const now = new Date();
    const record: ClickRecord = {
      id,
      date: insertRecord.date,
      clicks: insertRecord.clicks,
      createdAt: now,
      updatedAt: now,
    };
    this.clickRecords.set(insertRecord.date, record);
    return record;
  }

  async updateClickRecord(date: string, clicks: number): Promise<ClickRecord> {
    const existingRecord = this.clickRecords.get(date);
    if (!existingRecord) {
      throw new Error(`Click record for date ${date} not found`);
    }
    
    const updatedRecord: ClickRecord = {
      ...existingRecord,
      clicks,
      updatedAt: new Date(),
    };
    this.clickRecords.set(date, updatedRecord);
    return updatedRecord;
  }

  async getAllClickRecords(): Promise<ClickRecord[]> {
    return Array.from(this.clickRecords.values()).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  async getClickRecordsInRange(startDate: string, endDate: string): Promise<ClickRecord[]> {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return Array.from(this.clickRecords.values())
      .filter(record => {
        const recordDate = new Date(record.date);
        return recordDate >= start && recordDate <= end;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
}

export const storage = new MemStorage();
