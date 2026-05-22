import { pgTable, serial, text, numeric, timestamp, integer } from "drizzle-orm/pg-core";
import { groupsTable } from "./groups.js";

export const playerDeletionLogTable = pgTable("player_deletion_log", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull().references(() => groupsTable.id, { onDelete: "cascade" }),
  playerName: text("player_name").notNull(),
  chipBalance: numeric("chip_balance", { precision: 10, scale: 2 }).notNull(),
  fixumAmount: numeric("fixum_amount", { precision: 10, scale: 2 }).notNull(),
  deletedAt: timestamp("deleted_at").notNull().defaultNow(),
});

export type PlayerDeletionLog = typeof playerDeletionLogTable.$inferSelect;
