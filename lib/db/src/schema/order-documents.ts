import { pgTable, serial, timestamp, integer, text } from "drizzle-orm/pg-core";
import { ordersTable } from "./orders";
import { usersTable } from "./users";

export const orderDocumentsTable = pgTable("order_documents", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => ordersTable.id, { onDelete: "cascade" }),
  documentType: text("document_type").notNull(), // po, invoice, eway_bill, delivery_note, other
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  fileSize: integer("file_size"),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
  uploadedBy: integer("uploaded_by").references(() => usersTable.id),
});

export type OrderDocument = typeof orderDocumentsTable.$inferSelect;
export type NewOrderDocument = typeof orderDocumentsTable.$inferInsert;

// Made with Bob