import { pgTable, serial, timestamp, integer, text } from "drizzle-orm/pg-core";
import { ordersTable } from "./orders";
import { gemStagesTable } from "./gem-stages";
import { usersTable } from "./users";

export const orderStageHistoryTable = pgTable("order_stage_history", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => ordersTable.id, { onDelete: "cascade" }),
  fromStageId: integer("from_stage_id").references(() => gemStagesTable.id),
  toStageId: integer("to_stage_id").references(() => gemStagesTable.id),
  changedBy: integer("changed_by").references(() => usersTable.id),
  changedAt: timestamp("changed_at").notNull().defaultNow(),
  notes: text("notes"),
  durationDays: integer("duration_days"), // Time spent in previous stage
});

export type OrderStageHistory = typeof orderStageHistoryTable.$inferSelect;
export type NewOrderStageHistory = typeof orderStageHistoryTable.$inferInsert;

// Made with Bob