import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const adminSettingsTable = pgTable("admin_settings", {
  id: serial("id").primaryKey(),
  passwordHash: text("password_hash").notNull(),
  passwordSalt: text("password_salt").notNull(),
  bankChipPercentage: integer("bank_chip_percentage").notNull().default(10),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
