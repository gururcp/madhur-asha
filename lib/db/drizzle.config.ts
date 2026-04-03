import { defineConfig } from "drizzle-kit";

// Note: drizzle-kit will load .env from the workspace root automatically.
// If running from a subdirectory on Windows, ensure DATABASE_URL is set in environment
// or run from workspace root: pnpm --filter @workspace/db push

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Ensure .env file exists in workspace root or DATABASE_URL is in environment.");
}

export default defineConfig({
  schema: "./src/schema/*.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
