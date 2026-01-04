import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
const { Pool } = pkg;
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  console.log("DATABASE_URL not set. Running in standalone mode.");
}

const pool = process.env.DATABASE_URL
  ? new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
    // OPTIMIZED FOR 1000+ SESSIONS
    max: 100, // Maximum connections (default: 10)
    idleTimeoutMillis: 30000, // Close idle connections after 30s
    connectionTimeoutMillis: 10000, // Fail fast if can't connect
  })
  : null;

export const db = pool ? drizzle(pool, { schema }) : null;
