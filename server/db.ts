import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@shared/schema";

// Use Supabase URL if available, otherwise fall back to DATABASE_URL
const databaseUrl = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "SUPABASE_DATABASE_URL or DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// CRITICAL: For Supabase Transaction Pooler (port 6543), we MUST set prepare: false
// This is required because the pooler doesn't support prepared statements
export const client = postgres(databaseUrl, {
  ssl: 'require',
  prepare: false, // Required for Supabase Transaction Pooler
});
export const db = drizzle(client, { schema });
