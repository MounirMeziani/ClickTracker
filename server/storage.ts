import { 
  users, 
  clickRecords, 
  playerProfile, 
  dailyChallenges,
  teams,
  teamMembers,
  teamActivity,
  goals,
  playerGoals,
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
  type Team,
  type InsertTeam,
  type TeamMember,
  type InsertTeamMember,
  type TeamActivity,
  type InsertTeamActivity,
  type Goal,
  type InsertGoal,
  type PlayerGoal,
  type InsertPlayerGoal,
  type GoalClickRecord,
  type InsertGoalClickRecord
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
  
  // Team features
  getPlayerTeam(playerId: number): Promise<Team | undefined>;
  getTeamMembers(teamId: number): Promise<Array<{member: TeamMember, profile: PlayerProfile}>>;
  getTeamActivity(teamId: number, days: number): Promise<TeamActivity[]>;
  createTeam(team: InsertTeam): Promise<Team>;
  joinTeam(teamId: number, playerId: number): Promise<TeamMember>;
  getTeamLeaderboard(teamId: number): Promise<Array<{profile: PlayerProfile, rank: number}>>;
  
  // Goal management
  getAllGoals(): Promise<Goal[]>;
  createGoal(goal: InsertGoal): Promise<Goal>;
  getPlayerGoals(playerId: number): Promise<PlayerGoal[]>;
  getPlayerGoal(playerId: number, goalId: number): Promise<PlayerGoal | undefined>;
  createPlayerGoal(playerGoal: InsertPlayerGoal): Promise<PlayerGoal>;
  updatePlayerGoal(id: number, updates: Partial<PlayerGoal>): Promise<PlayerGoal>;
  
  // Goal click tracking
  getGoalClickRecord(playerId: number, goalId: number, date: string): Promise<GoalClickRecord | undefined>;
  createGoalClickRecord(record: InsertGoalClickRecord): Promise<GoalClickRecord>;
  updateGoalClickRecord(id: number, clicks: number): Promise<GoalClickRecord>;
  getGoalClickRecords(playerId: number, goalId: number, startDate: string, endDate: string): Promise<GoalClickRecord[]>;
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
    const [record] = await db
      .select()
      .from(clickRecords)
      .where(eq(clickRecords.date, date));
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
    return record;
  }

  async getAllClickRecords(): Promise<ClickRecord[]> {
    return await db.select().from(clickRecords).orderBy(desc(clickRecords.date));
  }

  async getClickRecordsInRange(startDate: string, endDate: string): Promise<ClickRecord[]> {
    return await db
      .select()
      .from(clickRecords)
      .where(and(
        gte(clickRecords.date, startDate),
        lte(clickRecords.date, endDate)
      ))
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
    const profile = await this.getPlayerProfile();
    if (!profile) {
      throw new Error("Player profile not found");
    }

    const [updatedProfile] = await db
      .update(playerProfile)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(playerProfile.id, profile.id))
      .returning();
    return updatedProfile;
  }

  async getDailyChallengeByDate(date: string): Promise<DailyChallenge | undefined> {
    const [challenge] = await db
      .select()
      .from(dailyChallenges)
      .where(eq(dailyChallenges.date, date));
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

  // Team methods
  async getPlayerTeam(playerId: number): Promise<Team | undefined> {
    const profile = await this.getPlayerProfile();
    if (!profile?.teamId) return undefined;

    const [team] = await db.select().from(teams).where(eq(teams.id, profile.teamId));
    return team || undefined;
  }

  async getTeamMembers(teamId: number): Promise<Array<{member: TeamMember, profile: PlayerProfile}>> {
    const members = await db.select().from(teamMembers).where(eq(teamMembers.teamId, teamId));
    const memberProfiles = [];

    for (const member of members) {
      const [profile] = await db.select().from(playerProfile).where(eq(playerProfile.id, member.playerId));
      if (profile) {
        memberProfiles.push({ member, profile });
      }
    }

    return memberProfiles;
  }

  async getTeamActivity(teamId: number, days: number): Promise<TeamActivity[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return await db.select().from(teamActivity)
      .where(
        and(
          eq(teamActivity.teamId, teamId),
          gte(teamActivity.date, startDate.toISOString().split('T')[0])
        )
      )
      .orderBy(desc(teamActivity.date));
  }

  async createTeam(team: InsertTeam): Promise<Team> {
    const [newTeam] = await db
      .insert(teams)
      .values(team)
      .returning();
    return newTeam;
  }

  async joinTeam(teamId: number, playerId: number): Promise<TeamMember> {
    const [member] = await db
      .insert(teamMembers)
      .values({ teamId, playerId, role: "member" })
      .returning();
    return member;
  }

  async getTeamLeaderboard(teamId: number): Promise<Array<{profile: PlayerProfile, rank: number}>> {
    const members = await this.getTeamMembers(teamId);
    const profiles = members
      .map(m => m.profile)
      .sort((a, b) => b.totalClicks - a.totalClicks);
    
    return profiles.map((profile, index) => ({
      profile,
      rank: index + 1
    }));
  }

  // Goal management methods
  async getAllGoals(): Promise<Goal[]> {
    return await db.select().from(goals);
  }

  async createGoal(goal: InsertGoal): Promise<Goal> {
    const [newGoal] = await db
      .insert(goals)
      .values(goal)
      .returning();
    return newGoal;
  }

  async getPlayerGoals(playerId: number): Promise<PlayerGoal[]> {
    return await db.select().from(playerGoals).where(eq(playerGoals.playerId, playerId));
  }

  async getPlayerGoal(playerId: number, goalId: number): Promise<PlayerGoal | undefined> {
    const [playerGoal] = await db.select()
      .from(playerGoals)
      .where(and(eq(playerGoals.playerId, playerId), eq(playerGoals.goalId, goalId)));
    return playerGoal;
  }

  async createPlayerGoal(playerGoal: InsertPlayerGoal): Promise<PlayerGoal> {
    const [newPlayerGoal] = await db
      .insert(playerGoals)
      .values(playerGoal)
      .returning();
    return newPlayerGoal;
  }

  async updatePlayerGoal(id: number, updates: Partial<PlayerGoal>): Promise<PlayerGoal> {
    const [updatedPlayerGoal] = await db
      .update(playerGoals)
      .set(updates)
      .where(eq(playerGoals.id, id))
      .returning();
    return updatedPlayerGoal;
  }

  // Goal click tracking methods
  async getGoalClickRecord(playerId: number, goalId: number, date: string): Promise<GoalClickRecord | undefined> {
    const [record] = await db.select()
      .from(goalClickRecords)
      .where(and(
        eq(goalClickRecords.playerId, playerId),
        eq(goalClickRecords.goalId, goalId),
        eq(goalClickRecords.date, date)
      ));
    return record;
  }

  async createGoalClickRecord(record: InsertGoalClickRecord): Promise<GoalClickRecord> {
    const [newRecord] = await db
      .insert(goalClickRecords)
      .values(record)
      .returning();
    return newRecord;
  }

  async updateGoalClickRecord(id: number, clicks: number): Promise<GoalClickRecord> {
    const [updatedRecord] = await db
      .update(goalClickRecords)
      .set({ clicks })
      .where(eq(goalClickRecords.id, id))
      .returning();
    return updatedRecord;
  }

  async getGoalClickRecords(playerId: number, goalId: number, startDate: string, endDate: string): Promise<GoalClickRecord[]> {
    return await db.select()
      .from(goalClickRecords)
      .where(and(
        eq(goalClickRecords.playerId, playerId),
        eq(goalClickRecords.goalId, goalId),
        gte(goalClickRecords.date, startDate),
        lte(goalClickRecords.date, endDate)
      ))
      .orderBy(desc(goalClickRecords.date));
  }
}

export const storage = new DatabaseStorage();