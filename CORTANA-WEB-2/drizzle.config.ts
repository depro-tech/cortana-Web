import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

// For production, append sslmode=require to the connection string if not present
const getDatabaseUrl = () => {
  const url = process.env.DATABASE_URL!;
  if (process.env.NODE_ENV === 'production' && !url.includes('sslmode=')) {
    return `${url}${url.includes('?') ? '&' : '?'}sslmode=no-verify`;
  }
  return url;
};

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: getDatabaseUrl(),
  },
});
