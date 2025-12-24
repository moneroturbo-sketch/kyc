import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

// Enhanced database URL validation with SSL support for Render
function getDatabaseConfig() {
  let dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    console.error("❌ CRITICAL ERROR: DATABASE_URL not set!");
    throw new Error(
      "DATABASE_URL must be set. Configure it in Render environment variables with key 'DATABASE_URL'"
    );
  }
  
  // Validate it looks like a postgres URL
  if (!dbUrl.includes("postgresql://") && !dbUrl.includes("postgres://")) {
    console.error("❌ ERROR: DATABASE_URL doesn't look like a PostgreSQL connection string");
    throw new Error("Invalid DATABASE_URL format");
  }
  
  // Extract and log hostname for debugging
  const match = dbUrl.match(/@([^:/]+)/);
  if (match) {
    console.log("✅ Connecting to database at:", match[1]);
  }
  
  // Add SSL parameters to URL for Render PostgreSQL
  // Render requires ?sslmode=require for secure connections
  if (!dbUrl.includes("sslmode")) {
    if (dbUrl.includes("?")) {
      dbUrl += "&sslmode=require";
    } else {
      dbUrl += "?sslmode=require";
    }
    console.log("🔒 Added sslmode=require to connection string");
  }
  
  // Create pool config with both URL params AND pool-level SSL
  const poolConfig: any = { 
    connectionString: dbUrl
  };
  
  // Also set SSL at pool level for redundancy
  poolConfig.ssl = {
    rejectUnauthorized: false
  };
  
  console.log("✅ SSL/TLS: ENABLED for Render PostgreSQL");
  
  return poolConfig;
}

const poolConfig = getDatabaseConfig();
export const pool = new Pool(poolConfig);
export const db = drizzle(pool, { schema });
