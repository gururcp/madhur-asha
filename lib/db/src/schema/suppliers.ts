import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const suppliersTable = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  businessName: text("business_name").notNull(),
  gstin: text("gstin").unique(),
  contactPerson: text("contact_person"),
  
  // GST-related fields
  status: text("status"), // from GST API
  address: text("address"),
  state: text("state"),
  pincode: text("pincode"),
  
  // Supplier-specific fields
  contactInfo: text("contact_info"),
  paymentTerms: text("payment_terms"), // Net 7, Net 15, Net 30, Net 45, Net 60
  bankAccount: text("bank_account"), // JSON string: {accountNo, ifsc, bankName}
  
  // Zoho integration fields
  zohoId: text("zoho_id"),
  zohoSyncStatus: text("zoho_sync_status"), // 'pending' | 'syncing' | 'synced' | 'error'
  zohoSyncedAt: timestamp("zoho_synced_at"),
  zohoErrorMessage: text("zoho_error_message"),
  
  createdBy: integer("created_by").references(() => usersTable.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Supplier = typeof suppliersTable.$inferSelect;
export type NewSupplier = typeof suppliersTable.$inferInsert;

// Made with Bob
