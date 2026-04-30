import { pgTable, serial, text, timestamp, integer, decimal, date } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { customersTable } from "./customers";
import { suppliersTable } from "./suppliers";
import { itemsTable } from "./items";
import { gemStagesTable } from "./gem-stages";

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").unique().notNull(), // Auto: MAE-2026-001
  
  // Relationships
  customerId: integer("customer_id").references(() => customersTable.id),
  supplierId: integer("supplier_id").references(() => suppliersTable.id),
  itemId: integer("item_id").references(() => itemsTable.id),
  stageId: integer("stage_id").references(() => gemStagesTable.id),
  
  // Item Details
  itemDescription: text("item_description").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unit: text("unit").notNull(), // Nos, Kg, Litre, etc.
  
  // Purchase Side (from Supplier)
  supplierRate: decimal("supplier_rate", { precision: 10, scale: 2 }).notNull(), // Ex-GST rate
  purchaseGstPct: decimal("purchase_gst_pct", { precision: 5, scale: 2 }).notNull(),
  purchaseTotalExGst: decimal("purchase_total_ex_gst", { precision: 12, scale: 2 }), // Calculated
  purchaseTotalIncGst: decimal("purchase_total_inc_gst", { precision: 12, scale: 2 }), // Calculated
  
  // Sale Side (to Customer/Govt)
  sellingRate: decimal("selling_rate", { precision: 10, scale: 2 }).notNull(), // Ex-GST rate
  saleGstPct: decimal("sale_gst_pct", { precision: 5, scale: 2 }).notNull(),
  saleTotalExGst: decimal("sale_total_ex_gst", { precision: 12, scale: 2 }), // Calculated
  saleTotalIncGst: decimal("sale_total_inc_gst", { precision: 12, scale: 2 }), // Calculated
  
  // Profit Calculation
  commission: decimal("commission", { precision: 10, scale: 2 }).default("0"),
  otherExpenses: decimal("other_expenses", { precision: 10, scale: 2 }).default("0"),
  grossProfit: decimal("gross_profit", { precision: 12, scale: 2 }), // Calculated: sale - purchase
  allocatedGenericExpenses: decimal("allocated_generic_expenses", { precision: 10, scale: 2 }).default("0"), // Auto-calculated
  netProfit: decimal("net_profit", { precision: 12, scale: 2 }), // Calculated: gross - commission - expenses - allocated
  
  // Payment Tracking - Receivable (from Govt)
  invoiceNumber: text("invoice_number"),
  invoiceDate: date("invoice_date"),
  invoiceAmount: decimal("invoice_amount", { precision: 12, scale: 2 }),
  paymentDueDate: date("payment_due_date"),
  receivedAmount: decimal("received_amount", { precision: 12, scale: 2 }).default("0"),
  paymentReceivedDate: date("payment_received_date"),
  paymentStatus: text("payment_status").default("pending"), // pending, partial, paid, overdue
  
  // Payment Tracking - Payable (to Supplier)
  supplierInvoiceNumber: text("supplier_invoice_number"),
  supplierInvoiceDate: date("supplier_invoice_date"),
  supplierInvoiceAmount: decimal("supplier_invoice_amount", { precision: 12, scale: 2 }),
  supplierCreditDays: integer("supplier_credit_days").default(0),
  supplierPaymentDueDate: date("supplier_payment_due_date"),
  advancePaid: decimal("advance_paid", { precision: 10, scale: 2 }).default("0"),
  supplierPaidAmount: decimal("supplier_paid_amount", { precision: 12, scale: 2 }).default("0"),
  supplierPaymentDate: date("supplier_payment_date"),
  supplierPaymentStatus: text("supplier_payment_status").default("pending"),
  
  // Documents
  poNumber: text("po_number"),
  poDate: date("po_date"),
  poDocumentUrl: text("po_document_url"),
  ewayBillNumber: text("eway_bill_number"),
  dispatchDate: date("dispatch_date"),
  deliveryDate: date("delivery_date"),
  
  // Meta
  notes: text("notes"),
  priority: text("priority").default("normal"), // low, normal, high, urgent
  tags: text("tags").array(),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdBy: integer("created_by").references(() => usersTable.id),
});

export type Order = typeof ordersTable.$inferSelect;
export type NewOrder = typeof ordersTable.$inferInsert;

// Made with Bob