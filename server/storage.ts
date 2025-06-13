import { 
  users, 
  clickRecords, 
  playerProfile, 
  dailyChallenges,
  goals,
  goalClickRecords,
  teams,
  teamMembers,
  teamInvites,
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
  type Team,
  type InsertTeam,
  type TeamMember,
  type InsertTeamMember,
  type TeamInvite,
  type InsertTeamInvite,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

// Clean storage interface for the new goals system
export interface IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
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
  
  // Team management
  createTeam(team: InsertTeam): Promise<Team>;
  getTeam(teamId: number): Promise<Team | undefined>;
  getUserTeams(userId: number): Promise<Team[]>;
  getTeamMembers(teamId: number): Promise<Array<{member: TeamMember, user: User, profile: PlayerProfile}>>;
  addTeamMember(member: InsertTeamMember): Promise<TeamMember>;
  removeTeamMember(teamId: number, userId: number): Promise<void>;
  deleteTeam(teamId: number): Promise<void>;
  
  // Team invites
  createTeamInvite(invite: InsertTeamInvite): Promise<TeamInvite>;
  getTeamInvite(inviteCode: string): Promise<TeamInvite | undefined>;
  acceptTeamInvite(inviteCode: string, userId: number): Promise<{success: boolean, team?: Team}>;
  getTeamInvites(teamId: number): Promise<TeamInvite[]>;
  
  // Team progress tracking
  getTeamProgress(teamId: number): Promise<Array<{user: User, profile: PlayerProfile, goals: Goal[], todayClicks: number}>>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
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
    const [newRecord] = await db.insert(goalClickRecords).values({
      ...record,
      playerId: 1 // Hardcoded for single-player mode
    }).returning();
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

  // Team management
  async createTeam(teamData: InsertTeam): Promise<Team> {
    const [team] = await db.insert(teams).values(teamData).returning();
    return team;
  }

  async getTeam(teamId: number): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.id, teamId));
    return team;
  }

  async getUserTeams(userId: number): Promise<Team[]> {
    const result = await db
      .select({ team: teams })
      .from(teamMembers)
      .innerJoin(teams, eq(teamMembers.teamId, teams.id))
      .where(eq(teamMembers.playerId, userId));
    
    return result.map(r => r.team);
  }

  async getTeamMembers(teamId: number): Promise<Array<{member: TeamMember, user: User, profile: PlayerProfile}>> {
    const result = await db
      .select({
        member: teamMembers,
        user: users,
        profile: playerProfile
      })
      .from(teamMembers)
      .innerJoin(users, eq(teamMembers.playerId, users.id))
      .leftJoin(playerProfile, eq(users.id, playerProfile.id))
      .where(eq(teamMembers.teamId, teamId));

    return result;
  }

  async addTeamMember(memberData: InsertTeamMember): Promise<TeamMember> {
    const [member] = await db.insert(teamMembers).values(memberData).returning();
    return member;
  }

  async removeTeamMember(teamId: number, userId: number): Promise<void> {
    await db.delete(teamMembers)
      .where(and(
        eq(teamMembers.teamId, teamId),
        eq(teamMembers.playerId, userId)
      ));
  }

  // Team invites
  async createTeamInvite(inviteData: InsertTeamInvite): Promise<TeamInvite> {
    const [invite] = await db.insert(teamInvites).values(inviteData).returning();
    return invite;
  }

  async getTeamInvite(inviteCode: string): Promise<TeamInvite | undefined> {
    const [invite] = await db.select().from(teamInvites)
      .where(eq(teamInvites.inviteCode, inviteCode));
    return invite;
  }

  async acceptTeamInvite(inviteCode: string, userId: number): Promise<{success: boolean, team?: Team}> {
    const invite = await this.getTeamInvite(inviteCode);
    
    if (!invite) {
      return { success: false };
    }

    if (invite.status !== 'pending') {
      return { success: false };
    }

    if (new Date() > invite.expiresAt) {
      return { success: false };
    }

    // Check if user is already a team member
    const existingMember = await db.select().from(teamMembers)
      .where(and(
        eq(teamMembers.teamId, invite.teamId),
        eq(teamMembers.playerId, userId)
      ));

    if (existingMember.length > 0) {
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
      .set({ 
        status: 'accepted',
        usedAt: new Date()
      })
      .where(eq(teamInvites.inviteCode, inviteCode));

    const team = await this.getTeam(invite.teamId);
    return { success: true, team };
  }

  async getTeamInvites(teamId: number): Promise<TeamInvite[]> {
    return await db.select().from(teamInvites)
      .where(eq(teamInvites.teamId, teamId))
      .orderBy(desc(teamInvites.createdAt));
  }

  async deleteTeam(teamId: number): Promise<void> {
    // Delete in the correct order to respect foreign key constraints
    // First delete team invites
    await db.delete(teamInvites).where(eq(teamInvites.teamId, teamId));
    
    // Then delete team members
    await db.delete(teamMembers).where(eq(teamMembers.teamId, teamId));
    
    // Finally delete the team itself
    await db.delete(teams).where(eq(teams.id, teamId));
  }

  // Team progress tracking
  async getTeamProgress(teamId: number): Promise<Array<{user: User, profile: PlayerProfile, goals: Goal[], todayClicks: number}>> {
    const members = await this.getTeamMembers(teamId);
    const today = new Date().toISOString().split('T')[0];
    
    const progress = [];
    
    for (const { user, profile } of members) {
      // Get user's goals
      const userGoals = await this.getGoals(user.id);
      
      // Get today's clicks from click records
      const todayRecord = await this.getClickRecordByDate(today);
      const todayClicks = todayRecord?.clicks || 0;
      
      progress.push({
        user,
        profile: profile || {
          id: user.id,
          currentLevel: 1,
          totalClicks: 0,
          currentSkin: 'rookie',
          unlockedSkins: ['rookie'],
          achievements: [],
          dailyChallengeCompleted: false,
          lastChallengeDate: null,
          streakCount: 0,
          teamId: null,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        goals: userGoals,
        todayClicks
      });
    }
    
    return progress;
  }
}

export const storage = new DatabaseStorage();