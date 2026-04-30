import { drizzle } from "drizzle-orm/node-postgres";
import { pgTable, serial, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import pg from "pg";

const { Pool } = pg;

// Define schema inline to avoid import issues
const gemStagesTable = pgTable("gem_stages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  displayName: text("display_name").notNull(),
  description: text("description"),
  color: text("color").notNull().default("#6366f1"),
  icon: text("icon"),
  sortOrder: integer("sort_order").notNull(),
  expectedDurationDays: integer("expected_duration_days"),
  isActive: boolean("is_active").default(true),
  isSystem: boolean("is_system").default(false),
  requiresPo: boolean("requires_po").default(false),
  requiresInvoice: boolean("requires_invoice").default(false),
  requiresEwayBill: boolean("requires_eway_bill").default(false),
  requiresPayment: boolean("requires_payment").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdBy: integer("created_by"),
});

const defaultStages = [
  {
    name: "ENQUIRY",
    displayName: "Enquiry",
    description: "Got requirement, searching for supplier",
    color: "#6366f1",
    icon: "Search",
    sortOrder: 1,
    expectedDurationDays: 3,
    isActive: true,
    isSystem: true,
    requiresPo: false,
    requiresInvoice: false,
    requiresEwayBill: false,
    requiresPayment: false,
  },
  {
    name: "SUPPLIER_FOUND",
    displayName: "Supplier Found",
    description: "Got supplier price, calculating profit",
    color: "#8b5cf6",
    icon: "UserCheck",
    sortOrder: 2,
    expectedDurationDays: 2,
    isActive: true,
    isSystem: true,
    requiresPo: false,
    requiresInvoice: false,
    requiresEwayBill: false,
    requiresPayment: false,
  },
  {
    name: "QUOTED",
    displayName: "Quoted",
    description: "Sent quote to government officer",
    color: "#ec4899",
    icon: "FileText",
    sortOrder: 3,
    expectedDurationDays: 7,
    isActive: true,
    isSystem: true,
    requiresPo: false,
    requiresInvoice: false,
    requiresEwayBill: false,
    requiresPayment: false,
  },
  {
    name: "PO_RECEIVED",
    displayName: "PO Received",
    description: "Government raised Purchase Order",
    color: "#f59e0b",
    icon: "FileCheck",
    sortOrder: 4,
    expectedDurationDays: 1,
    isActive: true,
    isSystem: true,
    requiresPo: true,
    requiresInvoice: false,
    requiresEwayBill: false,
    requiresPayment: false,
  },
  {
    name: "DISPATCHED",
    displayName: "Dispatched",
    description: "Sent dispatch order + eway bill",
    color: "#3b82f6",
    icon: "Truck",
    sortOrder: 5,
    expectedDurationDays: 3,
    isActive: true,
    isSystem: true,
    requiresPo: true,
    requiresInvoice: false,
    requiresEwayBill: true,
    requiresPayment: false,
  },
  {
    name: "DELIVERED",
    displayName: "Delivered",
    description: "Customer accepted delivery",
    color: "#10b981",
    icon: "PackageCheck",
    sortOrder: 6,
    expectedDurationDays: 1,
    isActive: true,
    isSystem: true,
    requiresPo: true,
    requiresInvoice: true,
    requiresEwayBill: true,
    requiresPayment: false,
  },
  {
    name: "PAYMENT_DUE",
    displayName: "Payment Due",
    description: "Waiting for government payment",
    color: "#f97316",
    icon: "Clock",
    sortOrder: 7,
    expectedDurationDays: 30,
    isActive: true,
    isSystem: true,
    requiresPo: true,
    requiresInvoice: true,
    requiresEwayBill: true,
    requiresPayment: false,
  },
  {
    name: "PAYMENT_RECEIVED",
    displayName: "Payment Received",
    description: "Got paid from government",
    color: "#14b8a6",
    icon: "BadgeCheck",
    sortOrder: 8,
    expectedDurationDays: 2,
    isActive: true,
    isSystem: true,
    requiresPo: true,
    requiresInvoice: true,
    requiresEwayBill: true,
    requiresPayment: true,
  },
  {
    name: "SUPPLIER_PAID",
    displayName: "Supplier Paid",
    description: "Paid supplier",
    color: "#06b6d4",
    icon: "Banknote",
    sortOrder: 9,
    expectedDurationDays: 1,
    isActive: true,
    isSystem: true,
    requiresPo: true,
    requiresInvoice: true,
    requiresEwayBill: true,
    requiresPayment: true,
  },
  {
    name: "COMPLETED",
    displayName: "Completed",
    description: "Everything settled",
    color: "#22c55e",
    icon: "CheckCircle2",
    sortOrder: 10,
    expectedDurationDays: null,
    isActive: true,
    isSystem: true,
    requiresPo: true,
    requiresInvoice: true,
    requiresEwayBill: true,
    requiresPayment: true,
  },
];

async function seedGemStages() {
  console.log("🌱 Seeding GeM stages...");
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  
  const db = drizzle(pool);
  
  try {
    // Check if stages already exist
    const existingStages = await db.select().from(gemStagesTable);
    
    if (existingStages.length > 0) {
      console.log("✅ GeM stages already exist. Skipping seed.");
      await pool.end();
      return;
    }
    
    // Insert default stages
    await db.insert(gemStagesTable).values(defaultStages);
    
    console.log("✅ Successfully seeded 10 default GeM stages");
  } catch (error) {
    console.error("❌ Error seeding GeM stages:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

seedGemStages()
  .then(() => {
    console.log("✅ Seed completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  });

// Made with Bob
