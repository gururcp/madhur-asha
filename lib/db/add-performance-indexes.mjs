/**
 * Add Performance Indexes
 *
 * This script adds recommended indexes to improve query performance
 * across the application. Run this after the initial schema is created.
 *
 * Usage:
 * DATABASE_URL="your-connection-string" node add-performance-indexes.mjs
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { sql } from 'drizzle-orm';

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

console.log('🔗 Connecting to database...');
const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});
const db = drizzle(pool);

async function addIndexes() {
  try {
    console.log('\n📊 Adding performance indexes...\n');

    // Orders table indexes
    console.log('Adding orders indexes...');
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_orders_stage_id
      ON orders(stage_id)
    `);
    console.log('✓ idx_orders_stage_id');

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_orders_customer_id 
      ON orders(customer_id)
    `);
    console.log('✓ idx_orders_customer_id');

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_orders_supplier_id 
      ON orders(supplier_id)
    `);
    console.log('✓ idx_orders_supplier_id');

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_orders_created_at 
      ON orders(created_at DESC)
    `);
    console.log('✓ idx_orders_created_at');

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_orders_payment_due_date 
      ON orders(payment_due_date) 
      WHERE payment_due_date IS NOT NULL
    `);
    console.log('✓ idx_orders_payment_due_date');

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_orders_supplier_payment_due_date
      ON orders(supplier_payment_due_date)
      WHERE supplier_payment_due_date IS NOT NULL
    `);
    console.log('✓ idx_orders_supplier_payment_due_date');

    // Order payments indexes
    console.log('\nAdding order_payments indexes...');
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_order_payments_order_id 
      ON order_payments(order_id)
    `);
    console.log('✓ idx_order_payments_order_id');

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_order_payments_payment_date 
      ON order_payments(payment_date DESC)
    `);
    console.log('✓ idx_order_payments_payment_date');

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_order_payments_type 
      ON order_payments(payment_type)
    `);
    console.log('✓ idx_order_payments_type');

    // Generic expenses indexes
    console.log('\nAdding generic_expenses indexes...');
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_generic_expenses_date 
      ON generic_expenses(expense_date DESC)
    `);
    console.log('✓ idx_generic_expenses_date');

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_generic_expenses_category 
      ON generic_expenses(category)
    `);
    console.log('✓ idx_generic_expenses_category');

    // Order stage history indexes
    console.log('\nAdding order_stage_history indexes...');
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_order_stage_history_order_id 
      ON order_stage_history(order_id)
    `);
    console.log('✓ idx_order_stage_history_order_id');

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_order_stage_history_changed_at 
      ON order_stage_history(changed_at DESC)
    `);
    console.log('✓ idx_order_stage_history_changed_at');

    // Customers indexes
    console.log('\nAdding customers indexes...');
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_customers_gstin 
      ON customers(gstin) 
      WHERE gstin IS NOT NULL
    `);
    console.log('✓ idx_customers_gstin');

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_customers_name 
      ON customers(name)
    `);
    console.log('✓ idx_customers_name');

    // Suppliers indexes
    console.log('\nAdding suppliers indexes...');
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_suppliers_gstin
      ON suppliers(gstin)
      WHERE gstin IS NOT NULL
    `);
    console.log('✓ idx_suppliers_gstin');

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_suppliers_business_name
      ON suppliers(business_name)
    `);
    console.log('✓ idx_suppliers_business_name');

    // Items indexes
    console.log('\nAdding items indexes...');
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_items_hsn_code 
      ON items(hsn_code) 
      WHERE hsn_code IS NOT NULL
    `);
    console.log('✓ idx_items_hsn_code');

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_items_name 
      ON items(name)
    `);
    console.log('✓ idx_items_name');

    // Composite indexes for common queries
    console.log('\nAdding composite indexes...');
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_orders_stage_created
      ON orders(stage_id, created_at DESC)
    `);
    console.log('✓ idx_orders_stage_created');

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_orders_customer_stage
      ON orders(customer_id, stage_id)
    `);
    console.log('✓ idx_orders_customer_stage');

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_orders_supplier_stage
      ON orders(supplier_id, stage_id)
    `);
    console.log('✓ idx_orders_supplier_stage');

    console.log('\n✅ All indexes added successfully!');
    console.log('\n📈 Performance optimization complete.');
    console.log('   - Query performance improved');
    console.log('   - Dashboard loads faster');
    console.log('   - Reports generate quicker');
    console.log('   - Payment alerts respond faster\n');

  } catch (error) {
    console.error('\n❌ Error adding indexes:', error);
    throw error;
  }
}

async function main() {
  try {
    await addIndexes();
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
    console.log('🔌 Database connection closed');
  }
}

main();

// Made with Bob
