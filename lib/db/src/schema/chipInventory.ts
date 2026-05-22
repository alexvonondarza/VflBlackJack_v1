import { pgTable, serial, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { groupsTable } from "./groups.js";

export const chipInventoryTable = pgTable("chip_inventory", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull().references(() => groupsTable.id, { onDelete: "cascade" }),
  value: numeric("value", { precision: 10, scale: 4 }).notNull(),
  quantity: integer("quantity").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
