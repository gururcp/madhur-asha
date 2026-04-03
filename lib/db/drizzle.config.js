import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "drizzle-kit";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from workspace root
config({ path: path.resolve(__dirname, "../../.env") });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Ensure .env file exists in workspace root.");
}

export default defineConfig({
  schema: "./src/schema/*.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});

// Made with Bob
