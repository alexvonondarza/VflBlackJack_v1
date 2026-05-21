import { pgTable, serial, integer, timestamp } from "drizzle-orm/pg-core";

export const chipInventoryTable = pgTable("chip_inventory", {
  id: serial("id").primaryKey(),
  value: integer("value").notNull(),
  quantity: integer("quantity").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
