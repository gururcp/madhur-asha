import { defineConfig } from "drizzle-kit";

// drizzle-kit should load .env automatically from workspace root
// If it doesn't work on Windows, set DATABASE_URL in environment before running
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set. Set it in environment or ensure .env exists in workspace root.");
}

export default defineConfig({
  schema: "./src/schema/*.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});

// Made with Bob
