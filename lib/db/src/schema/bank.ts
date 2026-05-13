import { pgTable, serial, numeric, timestamp } from "drizzle-orm/pg-core";

export const bankTable = pgTable("bank", {
  id: serial("id").primaryKey(),
  balance: numeric("balance", { precision: 10, scale: 2 }).notNull().default("0.00"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Bank = typeof bankTable.$inferSelect;
