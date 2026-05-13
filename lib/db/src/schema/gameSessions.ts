import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { playersTable } from "./players";

export const gameSessionsTable = pgTable("game_sessions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  status: text("status", { enum: ["active", "ended"] }).notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  endedAt: timestamp("ended_at"),
});

export const gameSessionPlayersTable = pgTable("game_session_players", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => gameSessionsTable.id, { onDelete: "cascade" }),
  playerId: integer("player_id").notNull().references(() => playersTable.id, { onDelete: "cascade" }),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
});

export type GameSession = typeof gameSessionsTable.$inferSelect;
export type GameSessionPlayer = typeof gameSessionPlayersTable.$inferSelect;
