import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

// Enhanced database URL validation and debugging
function getDatabaseUrl(): string {
  // Check all possible sources
  const sources = {
    "process.env.DATABASE_URL": process.env.DATABASE_URL,
    "NODE_OPTIONS env": process.env.DATABASE_URL,
  };
  
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    console.error("❌ CRITICAL ERROR: DATABASE_URL not set!");
    console.error("Environment variables available:", Object.keys(process.env).filter(k => !k.includes('PASSWORD')));
    throw new Error(
      "DATABASE_URL must be set. Configure it in Render environment variables with key 'DATABASE_URL'"
    );
  }
  
  // Validate it looks like a postgres URL
  if (!dbUrl.includes("postgresql://") && !dbUrl.includes("postgres://")) {
    console.error("❌ ERROR: DATABASE_URL doesn't look like a PostgreSQL connection string");
    console.error("Expected format: postgresql://user:password@host:port/database");
    console.error("Got:", dbUrl.substring(0, 50) + "...");
    throw new Error("Invalid DATABASE_URL format");
  }
  
  // Extract and log hostname for debugging
  const match = dbUrl.match(/@([^:/]+)/);
  if (match) {
    console.log("✅ Connecting to database at:", match[1]);
  }
  
  return dbUrl;
}

const connectionString = getDatabaseUrl();
export const pool = new Pool({ connectionString });
export const db = drizzle(pool, { schema });
