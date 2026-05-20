import { pgTable, serial, integer, numeric, text, timestamp } from "drizzle-orm/pg-core";
import { playersTable } from "./players.js";
import { gameSessionsTable } from "./gameSessions.js";

export const balanceSnapshotsTable = pgTable("balance_snapshots", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull().references(() => playersTable.id, { onDelete: "cascade" }),
  playerName: text("player_name").notNull().default(""),
  sessionId: integer("session_id").notNull().references(() => gameSessionsTable.id, { onDelete: "cascade" }),
  sessionName: text("session_name").notNull(),
  balanceBefore: numeric("balance_before", { precision: 10, scale: 2 }).notNull(),
  balanceAfter: numeric("balance_after", { precision: 10, scale: 2 }).notNull(),
  capturedAt: timestamp("captured_at").notNull().defaultNow(),
});

export type BalanceSnapshot = typeof balanceSnapshotsTable.$inferSelect;
