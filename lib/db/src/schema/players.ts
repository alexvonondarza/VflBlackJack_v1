import { pgTable, serial, text, numeric, timestamp } from "drizzle-orm/pg-core";

export const playersTable = pgTable("players", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  chipBalance: numeric("chip_balance", { precision: 10, scale: 2 }).notNull().default("0.00"),
  fixumPaid: numeric("fixum_paid", { precision: 10, scale: 2 }).notNull().default("5.00"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Player = typeof playersTable.$inferSelect;
