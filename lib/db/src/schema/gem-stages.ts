import { pgTable, serial, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const gemStagesTable = pgTable("gem_stages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),                      // e.g., "ENQUIRY", "PO_RECEIVED"
  displayName: text("display_name").notNull(),       // e.g., "Enquiry", "PO Received"
  description: text("description"),
  color: text("color").notNull().default("#6366f1"), // Hex color for UI
  icon: text("icon"),                                // Icon name (lucide-react)
  sortOrder: integer("sort_order").notNull(),        // For ordering stages
  expectedDurationDays: integer("expected_duration_days"), // SLA in days
  isActive: boolean("is_active").default(true),      // Soft delete
  isSystem: boolean("is_system").default(false),     // Cannot be deleted
  
  // Mandatory fields before moving to next stage
  requiresPo: boolean("requires_po").default(false),
  requiresInvoice: boolean("requires_invoice").default(false),
  requiresEwayBill: boolean("requires_eway_bill").default(false),
  requiresPayment: boolean("requires_payment").default(false),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdBy: integer("created_by").references(() => usersTable.id),
});

export type GemStage = typeof gemStagesTable.$inferSelect;
export type NewGemStage = typeof gemStagesTable.$inferInsert;

// Made with Bob