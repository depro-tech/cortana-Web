import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const sessions = pgTable("sessions", {
  id: varchar("id").primaryKey(),
  phoneNumber: text("phone_number").notNull(),
  type: text("type").notNull().default("md"),
  creds: text("creds"),
  keys: text("keys"),
  status: text("status").default("pending"),
  createdBy: text("created_by"), // Track who created this session (Pair Chamber)
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSessionSchema = createInsertSchema(sessions).omit({
  createdAt: true,
});

export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessions.$inferSelect;

export const botSettings = pgTable("bot_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").references(() => sessions.id),
  prefix: text("prefix").default("."),
  ownerNumber: text("owner_number"),
  isPublic: boolean("is_public").default(true),
  antideleteMode: text("antidelete_mode").default("off"), // 'off' | 'all' | 'pm'
  autostatusView: boolean("autostatus_view").default(false),
  antiviewonceMode: text("antiviewonce_mode").default("off"), // 'off' | 'all' | 'pm'
  antieditMode: text("antiedit_mode").default("off"), // 'off' | 'all' | 'pm'
  antiban: boolean("antiban").default(false),
  autostatusDownload: boolean("autostatus_download").default(false),
});

export const insertBotSettingsSchema = createInsertSchema(botSettings).omit({
  id: true,
});

export type InsertBotSettings = z.infer<typeof insertBotSettingsSchema>;
export type BotSettings = typeof botSettings.$inferSelect;

export const groupSettings = pgTable("group_settings", {
  groupId: varchar("group_id").primaryKey(),
  sessionId: varchar("session_id").references(() => sessions.id),
  antilink: boolean("antilink").default(false), // Deprecated in favor of mode, keeping for compat if needed or just replace logic
  antilinkMode: text("antilink_mode").default("off"), // 'off' | 'kick' | 'warn'
  antibadword: boolean("antibadword").default(false),
  antitag: boolean("antitag").default(false), // Anti-tagall
  antigroupmentionMode: text("antigroupmention_mode").default("off"), // 'off' | 'kick' | 'warn'
  antileft: boolean("antileft").default(false), // Prison Mode - auto-add people who leave
  warnings: text("warnings").default("{}"), // JSON stringified map of userJid -> count
  chatbotEnabled: boolean("chatbot_enabled").default(false), // Chatbot on/off
});

export const insertGroupSettingsSchema = createInsertSchema(groupSettings);

export type InsertGroupSettings = z.infer<typeof insertGroupSettingsSchema>;
export type GroupSettings = typeof groupSettings.$inferSelect;

// Telegram Bot Login System Tables
export const telegramUsers = pgTable("telegram_users", {
  telegramId: varchar("telegram_id").primaryKey(),
  firstTrialUsed: boolean("first_trial_used").default(false),
  lastLoginGenerated: timestamp("last_login_generated"),
  isPremium: boolean("is_premium").default(false),
  premiumDays: text("premium_days").default("0"),
  premiumExpiresAt: timestamp("premium_expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTelegramUserSchema = createInsertSchema(telegramUsers).omit({
  createdAt: true,
});

export type InsertTelegramUser = z.infer<typeof insertTelegramUserSchema>;
export type TelegramUser = typeof telegramUsers.$inferSelect;

export const loginCredentials = pgTable("login_credentials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  telegramId: varchar("telegram_id").references(() => telegramUsers.telegramId),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
  isActive: boolean("is_active").default(true),
});

export const insertLoginCredentialSchema = createInsertSchema(loginCredentials).omit({
  id: true,
  createdAt: true,
});

// Economy System Table
export const economyUsers = pgTable("economy_users", {
  userJid: varchar("user_jid").primaryKey(),
  wallet: text("wallet").default("0"), // Storing big numbers as text/string to be safe
  bank: text("bank").default("0"),
  lastDaily: timestamp("last_daily"),
  lastWeekly: timestamp("last_weekly"),
  lastWork: timestamp("last_work"),
  lastRob: timestamp("last_rob"),
  inventory: text("inventory").default("[]"), // JSON string of items
});

export const insertEconomyUserSchema = createInsertSchema(economyUsers);
export type InsertEconomyUser = z.infer<typeof insertEconomyUserSchema>;
export type EconomyUser = typeof economyUsers.$inferSelect;
