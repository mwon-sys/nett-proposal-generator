import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, boolean } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const proposals = mysqlTable("proposals", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  clientName: varchar("clientName", { length: 256 }).notNull(),
  clientWebsite: varchar("clientWebsite", { length: 512 }).notNull(),
  industry: varchar("industry", { length: 256 }).notNull(),
  isEcommerce: boolean("isEcommerce").default(false).notNull(),
  goals: text("goals").notNull(),
  salesRep: varchar("salesRep", { length: 128 }).notNull(),
  salesRepEmail: varchar("salesRepEmail", { length: 320 }),
  salesRepPhone: varchar("salesRepPhone", { length: 32 }),
  setupFee: int("setupFee").default(0).notNull(),
  channels: json("channels").notNull(), // Array of {name, budget}
  totalMonthlySpend: int("totalMonthlySpend").default(0).notNull(),
  managementFee: int("managementFee").default(0).notNull(),
  managementFeePercent: varchar("managementFeePercent", { length: 16 }).notNull(),
  proposalData: json("proposalData"), // Full AI-generated proposal content
  status: mysqlEnum("status", ["generating", "ready", "error"]).default("generating").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Proposal = typeof proposals.$inferSelect;
export type InsertProposal = typeof proposals.$inferInsert;
