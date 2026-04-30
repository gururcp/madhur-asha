import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const itemsTable = pgTable("items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  hsnCode: text("hsn_code").notNull(), // 4-8 digit HSN/SAC code
  description: text("description"),
  
  // Pricing and unit
  unit: text("unit").notNull(), // Nos, Kg, Grams, Litre, Metre, Box, Bag, Piece, Set
  purchaseRate: text("purchase_rate").notNull(), // stored as string for precision
  sellingRate: text("selling_rate").notNull(), // stored as string for precision
  
  // Tax and type
  gstRate: text("gst_rate").notNull(), // 0, 5, 12, 18, 28
  itemType: text("item_type").notNull(), // 'goods' | 'service'
  
  // Zoho integration fields
  zohoId: text("zoho_id"),
  zohoSyncStatus: text("zoho_sync_status"), // 'pending' | 'syncing' | 'synced' | 'error'
  zohoSyncedAt: timestamp("zoho_synced_at"),
  zohoErrorMessage: text("zoho_error_message"),
  
  createdBy: integer("created_by").references(() => usersTable.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Item = typeof itemsTable.$inferSelect;
export type NewItem = typeof itemsTable.$inferInsert;

// Made with Bob
