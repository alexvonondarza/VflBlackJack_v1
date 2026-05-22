import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const groupsTable = pgTable("groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Group = typeof groupsTable.$inferSelect;
