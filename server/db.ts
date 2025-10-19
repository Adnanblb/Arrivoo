import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@shared/schema";

// Use Supabase database if available, otherwise fall back to Replit's Neon database
const databaseUrl = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL or SUPABASE_DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// CRITICAL: For Supabase Transaction Pooler (port 6543), we MUST set prepare: false
// This is required because the pooler doesn't support prepared statements
const isSupabase = databaseUrl.includes('supabase.com');

export const client = postgres(databaseUrl, {
  ssl: 'require',
  prepare: isSupabase ? false : undefined, // Disable prepared statements for Supabase pooler
});
export const db = drizzle(client, { schema });
