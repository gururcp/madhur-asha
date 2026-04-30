#!/usr/bin/env node
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '../..');

// Load .env from workspace root
config({ path: resolve(rootDir, '.env') });

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env file');
  process.exit(1);
}

console.log('🔄 Pushing schema changes to database...');

try {
  execSync('npx drizzle-kit push --config=drizzle.config.mjs', {
    cwd: __dirname,
    stdio: 'inherit',
    env: { ...process.env }
  });
  console.log('✅ Database schema updated successfully!');
} catch (error) {
  console.error('❌ Migration failed');
  process.exit(1);
}

// Made with Bob
