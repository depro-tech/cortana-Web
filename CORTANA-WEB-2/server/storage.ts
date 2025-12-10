import { 
  type User, type InsertUser, 
  type Session, type InsertSession,
  type BotSettings, type InsertBotSettings,
  type GroupSettings, type InsertGroupSettings,
  users, sessions, botSettings, groupSettings
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getSession(id: string): Promise<Session | undefined>;
  getSessionByPhone(phoneNumber: string): Promise<Session | undefined>;
  createSession(session: InsertSession): Promise<Session>;
  updateSession(id: string, data: Partial<InsertSession>): Promise<Session | undefined>;
  deleteSession(id: string): Promise<void>;
  getAllSessions(): Promise<Session[]>;
  
  getBotSettings(sessionId: string): Promise<BotSettings | undefined>;
  createBotSettings(settings: InsertBotSettings): Promise<BotSettings>;
  updateBotSettings(id: string, data: Partial<InsertBotSettings>): Promise<BotSettings | undefined>;
  
  getGroupSettings(groupId: string): Promise<GroupSettings | undefined>;
  createGroupSettings(settings: InsertGroupSettings): Promise<GroupSettings>;
  updateGroupSettings(groupId: string, data: Partial<InsertGroupSettings>): Promise<GroupSettings | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
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

  async getSession(id: string): Promise<Session | undefined> {
    const [session] = await db.select().from(sessions).where(eq(sessions.id, id));
    return session;
  }

  async getSessionByPhone(phoneNumber: string): Promise<Session | undefined> {
    const [session] = await db.select().from(sessions).where(eq(sessions.phoneNumber, phoneNumber));
    return session;
  }

  async createSession(session: InsertSession): Promise<Session> {
    const [created] = await db.insert(sessions).values(session).returning();
    return created;
  }

  async updateSession(id: string, data: Partial<InsertSession>): Promise<Session | undefined> {
    const [updated] = await db.update(sessions).set(data).where(eq(sessions.id, id)).returning();
    return updated;
  }

  async deleteSession(id: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.id, id));
  }

  async getAllSessions(): Promise<Session[]> {
    return db.select().from(sessions);
  }

  async getBotSettings(sessionId: string): Promise<BotSettings | undefined> {
    const [settings] = await db.select().from(botSettings).where(eq(botSettings.sessionId, sessionId));
    return settings;
  }

  async createBotSettings(settings: InsertBotSettings): Promise<BotSettings> {
    const [created] = await db.insert(botSettings).values(settings).returning();
    return created;
  }

  async updateBotSettings(id: string, data: Partial<InsertBotSettings>): Promise<BotSettings | undefined> {
    const [updated] = await db.update(botSettings).set(data).where(eq(botSettings.id, id)).returning();
    return updated;
  }

  async getGroupSettings(groupId: string): Promise<GroupSettings | undefined> {
    const [settings] = await db.select().from(groupSettings).where(eq(groupSettings.groupId, groupId));
    return settings;
  }

  async createGroupSettings(settings: InsertGroupSettings): Promise<GroupSettings> {
    const [created] = await db.insert(groupSettings).values(settings).returning();
    return created;
  }

  async updateGroupSettings(groupId: string, data: Partial<InsertGroupSettings>): Promise<GroupSettings | undefined> {
    const [updated] = await db.update(groupSettings).set(data).where(eq(groupSettings.groupId, groupId)).returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
