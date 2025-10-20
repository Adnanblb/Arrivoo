import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@shared/schema";

// Use Supabase PostgreSQL database
const databaseUrl = process.env.SUPABASE_DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "SUPABASE_DATABASE_URL must be set. Did you forget to configure Supabase?",
  );
}

export const client = postgres(databaseUrl, {
  ssl: 'require',
});
export const db = drizzle(client, { schema });
