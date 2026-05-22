import { pgTable, serial, text, timestamp, integer, numeric } from "drizzle-orm/pg-core";
import { playersTable } from "./players.js";
import { groupsTable } from "./groups.js";

export const gameSessionsTable = pgTable("game_sessions", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull().references(() => groupsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  status: text("status", { enum: ["active", "ended"] }).notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  endedAt: timestamp("ended_at"),
  bankBalanceBefore: numeric("bank_balance_before", { precision: 10, scale: 2 }),
  bankBalanceAfter: numeric("bank_balance_after", { precision: 10, scale: 2 }),
});

export const gameSessionPlayersTable = pgTable("game_session_players", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => gameSessionsTable.id, { onDelete: "cascade" }),
  playerId: integer("player_id").notNull().references(() => playersTable.id, { onDelete: "cascade" }),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
});

export type GameSession = typeof gameSessionsTable.$inferSelect;
export type GameSessionPlayer = typeof gameSessionPlayersTable.$inferSelect;
