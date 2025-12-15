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

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private sessions: Map<string, Session> = new Map();
  private botSettings: Map<string, BotSettings> = new Map();
  private groupSettings: Map<string, GroupSettings> = new Map();
  private currentId = 0;

  async getUser(id: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.id.toString() === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = (++this.currentId).toString();
    const user = { ...insertUser, id, createdAt: new Date() };
    this.users.set(id, user);
    return user;
  }

  async getSession(id: string): Promise<Session | undefined> {
    return this.sessions.get(id);
  }

  async getSessionByPhone(phoneNumber: string): Promise<Session | undefined> {
    return Array.from(this.sessions.values()).find(s => s.phoneNumber === phoneNumber);
  }

  async createSession(session: InsertSession): Promise<Session> {
    const id = session.id;
    const newSession = { ...session, createdAt: new Date(), updatedAt: new Date() };
    this.sessions.set(id, newSession);
    return newSession;
  }

  async updateSession(id: string, data: Partial<InsertSession>): Promise<Session | undefined> {
    const session = this.sessions.get(id);
    if (!session) return undefined;
    const updated = { ...session, ...data, updatedAt: new Date() };
    this.sessions.set(id, updated);
    return updated;
  }

  async deleteSession(id: string): Promise<void> {
    this.sessions.delete(id);
  }

  async getAllSessions(): Promise<Session[]> {
    return Array.from(this.sessions.values());
  }

  async getBotSettings(sessionId: string): Promise<BotSettings | undefined> {
    return Array.from(this.botSettings.values()).find(s => s.sessionId === sessionId);
  }

  async createBotSettings(settings: InsertBotSettings): Promise<BotSettings> {
    const id = (++this.currentId).toString();
    const newSettings = { ...settings, id, createdAt: new Date(), updatedAt: new Date() };
    this.botSettings.set(id, newSettings);
    return newSettings;
  }

  async updateBotSettings(id: string, data: Partial<InsertBotSettings>): Promise<BotSettings | undefined> {
    const settings = this.botSettings.get(id);
    if (!settings) return undefined;
    const updated = { ...settings, ...data, updatedAt: new Date() };
    this.botSettings.set(id, updated);
    return updated;
  }

  async getGroupSettings(groupId: string): Promise<GroupSettings | undefined> {
    return Array.from(this.groupSettings.values()).find(s => s.groupId === groupId);
  }

  async createGroupSettings(settings: InsertGroupSettings): Promise<GroupSettings> {
    const id = (++this.currentId).toString();
    const newSettings = { ...settings, id, createdAt: new Date(), updatedAt: new Date() };
    this.groupSettings.set(id, newSettings);
    return newSettings;
  }

  async updateGroupSettings(groupId: string, data: Partial<InsertGroupSettings>): Promise<GroupSettings | undefined> {
    const settings = Array.from(this.groupSettings.values()).find(s => s.groupId === groupId);
    if (!settings) return undefined;
    const updated = { ...settings, ...data, updatedAt: new Date() };
    this.groupSettings.set(settings.id.toString(), updated);
    return updated;
  }
}

// Check if we have a database URL, otherwise use memory storage
export const storage = process.env.DATABASE_URL ? new DatabaseStorage() : new MemStorage();
