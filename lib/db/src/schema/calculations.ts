import { pgTable, serial, integer, text, timestamp, jsonb, real } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { customersTable } from "./customers";

export const calculationsTable = pgTable("calculations", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customersTable.id, { onDelete: "set null" }),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  label: text("label"),
  billNumber: text("bill_number"),
  notes: text("notes"),
  date: timestamp("date").notNull(),
  inputs: jsonb("inputs").notNull(),
  result: jsonb("result").notNull(),
  netProfit: real("net_profit"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Calculation = typeof calculationsTable.$inferSelect;
