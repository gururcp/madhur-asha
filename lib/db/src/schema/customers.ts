import { pgTable, serial, text, timestamp, integer, unique } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const customersTable = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  gstin: text("gstin").unique(),
  address: text("address"),
  contact: text("contact"),
  
  // GST-related fields
  gstStatus: text("gst_status"),
  state: text("state"),
  pincode: text("pincode"),
  
  // Contact person field
  contactPerson: text("contact_person"),
  
  // Zoho integration fields
  zohoId: text("zoho_id"),
  zohoSyncStatus: text("zoho_sync_status"), // 'pending' | 'syncing' | 'synced' | 'error'
  zohoSyncedAt: timestamp("zoho_synced_at"),
  zohoErrorMessage: text("zoho_error_message"),
  
  createdBy: integer("created_by").references(() => usersTable.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Customer = typeof customersTable.$inferSelect;
