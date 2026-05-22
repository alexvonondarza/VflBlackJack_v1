import { pgTable, serial, numeric, timestamp, integer } from "drizzle-orm/pg-core";
import { groupsTable } from "./groups.js";

export const bankTable = pgTable("bank", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull().references(() => groupsTable.id, { onDelete: "cascade" }),
  balance: numeric("balance", { precision: 10, scale: 2 }).notNull().default("0.00"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Bank = typeof bankTable.$inferSelect;
