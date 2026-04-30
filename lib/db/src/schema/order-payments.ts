import { pgTable, serial, timestamp, integer, text, decimal, date } from "drizzle-orm/pg-core";
import { ordersTable } from "./orders";
import { usersTable } from "./users";

export const orderPaymentsTable = pgTable("order_payments", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => ordersTable.id, { onDelete: "cascade" }),
  paymentType: text("payment_type").notNull(), // 'receivable' | 'payable'
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  paymentDate: date("payment_date").notNull(),
  paymentMethod: text("payment_method"), // Cash, Bank Transfer, Cheque, UPI
  referenceNumber: text("reference_number"),
  notes: text("notes"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: integer("created_by").references(() => usersTable.id),
});

export type OrderPayment = typeof orderPaymentsTable.$inferSelect;
export type NewOrderPayment = typeof orderPaymentsTable.$inferInsert;

// Made with Bob