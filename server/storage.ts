import {
  users,
  clickRecords,
  playerProfile,
  dailyChallenges,
  teams,
  teamMembers,
  teamActivity,
  teamInvites,
  goals,
  goalClickRecords,
  type User,
  type UpsertUser,
  type ClickRecord,
  type InsertClickRecord,
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
  type GoalClickRecord,
  type InsertGoalClickRecord,
  type TeamInvite,
  type InsertTeamInvite,
} from "@shared/schema";

import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

// Storage interface for the authentication system
export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Click record methods
  getClickRecordByDate(date: string): Promise<ClickRecord | undefined>;
  createClickRecord(record: InsertClickRecord): Promise<ClickRecord>;
  updateClickRecord(date: string, clicks: number): Promise<ClickRecord>;
  getAllClickRecords(): Promise<ClickRecord[]>;
  getClickRecordsInRange(startDate: string, endDate: string): Promise<ClickRecord[]>;
  
  // Player profile methods (linked to authenticated user)
  getPlayerProfile(userId: string): Promise<PlayerProfile | undefined>;
  createPlayerProfile(profile: InsertPlayerProfile): Promise<PlayerProfile>;
  updatePlayerProfile(userId: string, updates: Partial<PlayerProfile>): Promise<PlayerProfile>;
  
  // Daily challenge methods
  getDailyChallengeByDate(date: string): Promise<DailyChallenge | undefined>;
  createDailyChallenge(challenge: InsertDailyChallenge): Promise<DailyChallenge>;
  getAllDailyChallenges(): Promise<DailyChallenge[]>;
  
  // Goals system (user-specific)
  getGoals(userId: string): Promise<Goal[]>;
  getGoal(id: number): Promise<Goal | undefined>;
  getActiveGoal(userId: string): Promise<Goal | undefined>;
  createGoal(goal: InsertGoal): Promise<Goal>;
  updateGoal(id: number, updates: Partial<Goal>): Promise<Goal>;
  deleteGoal(id: number): Promise<void>;
  setActiveGoal(userId: string, goalId: number): Promise<void>;
  
  // Goal click tracking
  getGoalClickRecord(goalId: number, date: string): Promise<GoalClickRecord | undefined>;
  createGoalClickRecord(record: InsertGoalClickRecord): Promise<GoalClickRecord>;
  updateGoalClickRecord(id: number, clicks: number): Promise<GoalClickRecord>;
  getGoalClickRecords(goalId: number, startDate: string, endDate: string): Promise<GoalClickRecord[]>;
  
  // Team management
  createTeam(team: InsertTeam): Promise<Team>;
  getTeam(teamId: number): Promise<Team | undefined>;
  getUserTeams(userId: string): Promise<Team[]>;
  getTeamMembers(teamId: number): Promise<Array<{member: TeamMember, user: User, profile: PlayerProfile | null}>>;
  addTeamMember(member: InsertTeamMember): Promise<TeamMember>;
  removeTeamMember(teamId: number, userId: string): Promise<void>;
  deleteTeam(teamId: number): Promise<void>;
  
  // Team invites
  createTeamInvite(invite: InsertTeamInvite): Promise<TeamInvite>;
  getTeamInvite(inviteCode: string): Promise<TeamInvite | undefined>;
  acceptTeamInvite(inviteCode: string, userId: string): Promise<{success: boolean, team?: Team}>;
  getTeamInvites(teamId: number): Promise<TeamInvite[]>;
  
  // Team progress tracking
  getTeamProgress(teamId: number): Promise<Array<{user: User, profile: PlayerProfile | null, goals: Goal[], todayClicks: number}>>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
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
    return await db.select().from(clickRecords)
      .where(and(
        sql`${clickRecords.date} >= ${startDate}`,
        sql`${clickRecords.date} <= ${endDate}`
      ))
      .orderBy(clickRecords.date);
  }

  // Player profile methods (now linked to authenticated user)
  async getPlayerProfile(userId: string): Promise<PlayerProfile | undefined> {
    const [profile] = await db.select().from(playerProfile).where(eq(playerProfile.userId, userId));
    return profile;
  }

  async createPlayerProfile(profile: InsertPlayerProfile): Promise<PlayerProfile> {
    const [newProfile] = await db.insert(playerProfile).values(profile).returning();
    return newProfile;
  }

  async updatePlayerProfile(userId: string, updates: Partial<PlayerProfile>): Promise<PlayerProfile> {
    const [profile] = await db
      .update(playerProfile)
      .set({ 
        userId,
        ...updates, 
        updatedAt: new Date() 
      })
      .where(eq(playerProfile.userId, userId))
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

  // Goals system (user-specific)
  async getGoals(userId: string): Promise<Goal[]> {
    return await db.select().from(goals)
      .where(eq(goals.playerId, userId))
      .orderBy(desc(goals.isActive), desc(goals.createdAt));
  }

  async getGoal(id: number): Promise<Goal | undefined> {
    const [goal] = await db.select().from(goals).where(eq(goals.id, id));
    return goal;
  }

  async getActiveGoal(userId: string): Promise<Goal | undefined> {
    const [goal] = await db.select().from(goals)
      .where(and(eq(goals.playerId, userId), eq(goals.isActive, true)));
    return goal;
  }

  async createGoal(goal: InsertGoal): Promise<Goal> {
    const [newGoal] = await db.insert(goals).values(goal).returning();
    return newGoal;
  }

  async updateGoal(id: number, updates: Partial<Goal>): Promise<Goal> {
    const [goal] = await db
      .update(goals)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(goals.id, id))
      .returning();
    return goal;
  }

  async deleteGoal(id: number): Promise<void> {
    await db.delete(goals).where(eq(goals.id, id));
  }

  async setActiveGoal(userId: string, goalId: number): Promise<void> {
    // First deactivate all goals for this user
    await db.update(goals)
      .set({ isActive: false })
      .where(eq(goals.playerId, userId));
    
    // Then activate the selected goal
    await db.update(goals)
      .set({ isActive: true })
      .where(and(eq(goals.id, goalId), eq(goals.playerId, userId)));
  }

  // Goal click tracking
  async getGoalClickRecord(goalId: number, date: string): Promise<GoalClickRecord | undefined> {
    const [record] = await db.select().from(goalClickRecords)
      .where(and(eq(goalClickRecords.goalId, goalId), eq(goalClickRecords.date, date)));
    return record;
  }

  async createGoalClickRecord(record: InsertGoalClickRecord): Promise<GoalClickRecord> {
    const [newRecord] = await db.insert(goalClickRecords).values({
      playerId: record.playerId,
      goalId: record.goalId,
      date: record.date,
      clicks: record.clicks || 0
    }).returning();
    return newRecord;
  }

  async updateGoalClickRecord(id: number, clicks: number): Promise<GoalClickRecord> {
    const [record] = await db
      .update(goalClickRecords)
      .set({ clicks, updatedAt: new Date() })
      .where(eq(goalClickRecords.id, id))
      .returning();
    return record;
  }

  async getGoalClickRecords(goalId: number, startDate: string, endDate: string): Promise<GoalClickRecord[]> {
    return await db.select().from(goalClickRecords)
      .where(and(
        eq(goalClickRecords.goalId, goalId),
        sql`${goalClickRecords.date} >= ${startDate}`,
        sql`${goalClickRecords.date} <= ${endDate}`
      ))
      .orderBy(goalClickRecords.date);
  }

  // Team management (updated for string user IDs)
  async createTeam(teamData: InsertTeam): Promise<Team> {
    const [team] = await db.insert(teams).values(teamData).returning();
    return team;
  }

  async getTeam(teamId: number): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.id, teamId));
    return team;
  }

  async getUserTeams(userId: string): Promise<Team[]> {
    return await db.select().from(teams)
      .innerJoin(teamMembers, eq(teams.id, teamMembers.teamId))
      .where(eq(teamMembers.playerId, userId))
      .then(results => results.map(result => result.teams));
  }

  async getTeamMembers(teamId: number): Promise<Array<{member: TeamMember, user: User, profile: PlayerProfile | null}>> {
    const results = await db.select()
      .from(teamMembers)
      .innerJoin(users, eq(teamMembers.playerId, users.id))
      .leftJoin(playerProfile, eq(users.id, playerProfile.userId))
      .where(eq(teamMembers.teamId, teamId));

    return results.map(result => ({
      member: result.team_members,
      user: result.users,
      profile: result.player_profile || null
    }));
  }

  async addTeamMember(memberData: InsertTeamMember): Promise<TeamMember> {
    const [member] = await db.insert(teamMembers).values(memberData).returning();
    return member;
  }

  async removeTeamMember(teamId: number, userId: string): Promise<void> {
    await db.delete(teamMembers)
      .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.playerId, userId)));
  }

  async createTeamInvite(inviteData: InsertTeamInvite): Promise<TeamInvite> {
    const [invite] = await db.insert(teamInvites).values(inviteData).returning();
    return invite;
  }

  async getTeamInvite(inviteCode: string): Promise<TeamInvite | undefined> {
    const [invite] = await db.select().from(teamInvites)
      .where(eq(teamInvites.inviteCode, inviteCode));
    return invite;
  }

  async acceptTeamInvite(inviteCode: string, userId: string): Promise<{success: boolean, team?: Team}> {
    const invite = await this.getTeamInvite(inviteCode);
    if (!invite || invite.status !== 'pending' || new Date() > invite.expiresAt) {
      return { success: false };
    }

    const team = await this.getTeam(invite.teamId);
    if (!team) {
      return { success: false };
    }

    // Add user to team
    await this.addTeamMember({
      teamId: invite.teamId,
      playerId: userId,
      role: 'member'
    });

    // Mark invite as accepted
    await db.update(teamInvites)
      .set({ status: 'accepted', usedAt: new Date() })
      .where(eq(teamInvites.inviteCode, inviteCode));

    return { success: true, team };
  }

  async getTeamInvites(teamId: number): Promise<TeamInvite[]> {
    return await db.select().from(teamInvites)
      .where(eq(teamInvites.teamId, teamId))
      .orderBy(desc(teamInvites.createdAt));
  }

  async deleteTeam(teamId: number): Promise<void> {
    await db.delete(teams).where(eq(teams.id, teamId));
  }

  async getTeamProgress(teamId: number): Promise<Array<{user: User, profile: PlayerProfile | null, goals: Goal[], todayClicks: number}>> {
    const members = await this.getTeamMembers(teamId);
    const today = new Date().toISOString().split('T')[0];

    const results = [];
    for (const member of members) {
      const userGoals = await this.getGoals(member.user.id);
      const todayRecord = await this.getClickRecordByDate(today);
      
      results.push({
        user: member.user,
        profile: member.profile,
        goals: userGoals,
        todayClicks: todayRecord?.clicks || 0
      });
    }

    return results;
  }
}

export const storage = new DatabaseStorage();