import { 
  users, 
  clickRecords, 
  playerProfile, 
  dailyChallenges,
  friends,
  dailyActivity,
  teams,
  teamMembers,
  invites,
  type User, 
  type InsertUser, 
  type ClickRecord, 
  type InsertClickRecord, 
  type UpdateClickRecord,
  type PlayerProfile,
  type InsertPlayerProfile,
  type DailyChallenge,
  type InsertDailyChallenge,
  type Friend,
  type InsertFriend,
  type DailyActivity,
  type InsertDailyActivity,
  type Team,
  type InsertTeam,
  type TeamMember,
  type InsertTeamMember,
  type Invite,
  type InsertInvite,
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
  
  // Social features
  getFriends(userId: number): Promise<Friend[]>;
  addFriend(friendship: InsertFriend): Promise<Friend>;
  updateDailyActivity(activity: InsertDailyActivity): Promise<DailyActivity>;
  getLeaderboard(limit: number): Promise<Array<{profile: PlayerProfile, rank: number}>>;
  getFriendActivity(friendId: number, days: number): Promise<DailyActivity[]>;
  
  // Team and invite methods
  createTeam(team: InsertTeam): Promise<Team>;
  getTeam(teamId: number): Promise<Team | undefined>;
  getTeamByInviteCode(inviteCode: string): Promise<Team | undefined>;
  getUserTeams(userId: number): Promise<Team[]>;
  addTeamMember(member: InsertTeamMember): Promise<TeamMember>;
  getTeamMembers(teamId: number): Promise<TeamMember[]>;
  createInvite(invite: InsertInvite): Promise<Invite>;
  getInvite(inviteCode: string): Promise<Invite | undefined>;
  acceptInvite(inviteCode: string, userId: number): Promise<boolean>;
  updateTeamMemberCount(teamId: number): Promise<void>;
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
    // Get the existing profile first
    const existingProfile = await this.getPlayerProfile();
    if (!existingProfile) {
      throw new Error("Player profile not found");
    }

    const [profile] = await db
      .update(playerProfile)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(playerProfile.id, existingProfile.id))
      .returning();
    
    if (!profile) {
      throw new Error("Failed to update player profile");
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

  async getFriends(userId: number): Promise<Friend[]> {
    return await db.select().from(friends).where(
      and(
        eq(friends.userId, userId),
        eq(friends.status, "accepted")
      )
    );
  }

  async addFriend(friendship: InsertFriend): Promise<Friend> {
    const [friend] = await db
      .insert(friends)
      .values(friendship)
      .returning();
    return friend;
  }

  async updateDailyActivity(activity: InsertDailyActivity): Promise<DailyActivity> {
    const existing = await db.select().from(dailyActivity).where(
      and(
        eq(dailyActivity.playerId, activity.playerId),
        eq(dailyActivity.date, activity.date)
      )
    );

    if (existing.length > 0) {
      const [updated] = await db
        .update(dailyActivity)
        .set(activity)
        .where(eq(dailyActivity.id, existing[0].id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(dailyActivity)
        .values(activity)
        .returning();
      return created;
    }
  }

  async getLeaderboard(limit: number): Promise<Array<{profile: PlayerProfile, rank: number}>> {
    const profiles = await db.select().from(playerProfile)
      .orderBy(desc(playerProfile.totalClicks))
      .limit(limit);
    
    return profiles.map((profile, index) => ({
      profile,
      rank: index + 1
    }));
  }

  async getFriendActivity(friendId: number, days: number): Promise<DailyActivity[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    return await db.select().from(dailyActivity)
      .where(
        and(
          eq(dailyActivity.playerId, friendId),
          gte(dailyActivity.date, startDate.toISOString().split('T')[0])
        )
      )
      .orderBy(desc(dailyActivity.date));
  }

  // Team methods
  async createTeam(team: InsertTeam): Promise<Team> {
    const inviteCode = Math.random().toString(36).substring(2, 15);
    const [newTeam] = await db
      .insert(teams)
      .values({
        ...team,
        inviteCode,
      })
      .returning();
    return newTeam;
  }

  async getTeam(teamId: number): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.id, teamId));
    return team;
  }

  async getTeamByInviteCode(inviteCode: string): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.inviteCode, inviteCode));
    return team;
  }

  async getUserTeams(userId: number): Promise<Team[]> {
    const result = await db
      .select({
        id: teams.id,
        name: teams.name,
        description: teams.description,
        ownerId: teams.ownerId,
        inviteCode: teams.inviteCode,
        isPublic: teams.isPublic,
        memberCount: teams.memberCount,
        createdAt: teams.createdAt,
        updatedAt: teams.updatedAt,
      })
      .from(teams)
      .innerJoin(teamMembers, eq(teams.id, teamMembers.teamId))
      .where(eq(teamMembers.userId, userId));
    
    return result;
  }

  async addTeamMember(member: InsertTeamMember): Promise<TeamMember> {
    const [newMember] = await db
      .insert(teamMembers)
      .values(member)
      .returning();
    
    // Update member count
    await this.updateTeamMemberCount(member.teamId);
    
    return newMember;
  }

  async getTeamMembers(teamId: number): Promise<TeamMember[]> {
    return await db.select().from(teamMembers).where(eq(teamMembers.teamId, teamId));
  }

  async createInvite(invite: InsertInvite): Promise<Invite> {
    const inviteCode = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    const [newInvite] = await db
      .insert(invites)
      .values({
        ...invite,
        inviteCode,
      })
      .returning();
    return newInvite;
  }

  async getInvite(inviteCode: string): Promise<Invite | undefined> {
    const [invite] = await db.select().from(invites).where(eq(invites.inviteCode, inviteCode));
    return invite;
  }

  async acceptInvite(inviteCode: string, userId: number): Promise<boolean> {
    const invite = await this.getInvite(inviteCode);
    if (!invite || invite.status !== "pending" || new Date() > invite.expiresAt) {
      return false;
    }

    // Add user to team
    await this.addTeamMember({
      teamId: invite.teamId,
      userId: userId,
      role: "member",
    });

    // Mark invite as used
    await db
      .update(invites)
      .set({
        status: "accepted",
        usedAt: new Date(),
      })
      .where(eq(invites.id, invite.id));

    return true;
  }

  async updateTeamMemberCount(teamId: number): Promise<void> {
    const memberCount = await db
      .select({ count: teamMembers.id })
      .from(teamMembers)
      .where(eq(teamMembers.teamId, teamId));

    await db
      .update(teams)
      .set({ memberCount: memberCount.length })
      .where(eq(teams.id, teamId));
  }
}

export const storage = new DatabaseStorage();
