import { pgTable, serial, integer, numeric, timestamp } from "drizzle-orm/pg-core";

export const chipInventoryTable = pgTable("chip_inventory", {
  id: serial("id").primaryKey(),
  value: numeric("value", { precision: 10, scale: 4 }).notNull(),
  quantity: integer("quantity").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
