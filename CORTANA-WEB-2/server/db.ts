import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
const { Pool } = pkg;
import * as schema from "@shared/schema";

if (!process.env.postgres://avnadmin:AVNS_-tuoyew5ufmdwFQkKU6@pg-1cd95cc0-karizedu159-776c.c.aivencloud.com:28013/defaultdb?sslmode=require) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });
