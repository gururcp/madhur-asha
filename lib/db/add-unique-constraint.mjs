import pkg from 'pg';
const { Pool } = pkg;

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function addUniqueConstraint() {
  try {
    console.log('Connecting to database...');
    console.log('Adding unique constraint to gstin column...');
    
    // First, remove any duplicate GSTINs by keeping only the first occurrence
    const deleteResult = await pool.query(`
      DELETE FROM customers a USING customers b
      WHERE a.id > b.id
      AND a.gstin IS NOT NULL
      AND a.gstin = b.gstin;
    `);
    
    console.log(`Removed ${deleteResult.rowCount} duplicate GSTIN(s).`);
    
    // Now add the unique constraint
    await pool.query(`
      ALTER TABLE customers
      ADD CONSTRAINT customers_gstin_unique UNIQUE (gstin);
    `);
    
    console.log('✓ Successfully added unique constraint to gstin column!');
  } catch (error) {
    console.error('Error details:', error);
    if (error.message && error.message.includes('already exists')) {
      console.log('Constraint already exists, skipping.');
    } else {
      throw error;
    }
  } finally {
    await pool.end();
  }
}

addUniqueConstraint();

// Made with Bob
