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
  creds: text("creds"),
  keys: text("keys"),
  status: text("status").default("pending"),
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
  warnings: text("warnings").default("{}"), // JSON stringified map of userJid -> count
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

export type InsertLoginCredential = z.infer<typeof insertLoginCredentialSchema>;
export type LoginCredential = typeof loginCredentials.$inferSelect;
