import { pgTable, serial, timestamp, integer, text, decimal, date } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const genericExpensesTable = pgTable("generic_expenses", {
  id: serial("id").primaryKey(),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  category: text("category").notNull(), // Travel, Food, Office, Utilities, Misc
  expenseDate: date("expense_date").notNull(),
  paymentMethod: text("payment_method"), // Cash, Bank Transfer, UPI
  receiptUrl: text("receipt_url"), // Upload receipt/bill
  notes: text("notes"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: integer("created_by").references(() => usersTable.id),
});

export type GenericExpense = typeof genericExpensesTable.$inferSelect;
export type NewGenericExpense = typeof genericExpensesTable.$inferInsert;

// Made with Bob