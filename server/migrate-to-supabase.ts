import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@shared/schema";

// Source database (Replit)
const sourceDb = drizzle(
  postgres(process.env.DATABASE_URL!, { ssl: 'require' }),
  { schema }
);

// Target database (Supabase)
const targetDb = drizzle(
  postgres(process.env.SUPABASE_DATABASE_URL!, { ssl: 'require' }),
  { schema }
);

async function migrateData() {
  console.log('🚀 Starting migration from Replit to Supabase...\n');

  try {
    // 1. Migrate Users
    console.log('📋 Migrating users...');
    const users = await sourceDb.select().from(schema.users);
    console.log(`Found ${users.length} users`);
    if (users.length > 0) {
      await targetDb.insert(schema.users).values(users).onConflictDoNothing();
      console.log('✅ Users migrated\n');
    }

    // 2. Migrate Hotels
    console.log('📋 Migrating hotels...');
    const hotels = await sourceDb.select().from(schema.hotels);
    console.log(`Found ${hotels.length} hotels`);
    if (hotels.length > 0) {
      await targetDb.insert(schema.hotels).values(hotels).onConflictDoNothing();
      console.log('✅ Hotels migrated\n');
    }

    // 3. Migrate PMS Configurations
    console.log('📋 Migrating PMS configurations...');
    const pmsConfigs = await sourceDb.select().from(schema.pmsConfigurations);
    console.log(`Found ${pmsConfigs.length} PMS configurations`);
    if (pmsConfigs.length > 0) {
      await targetDb.insert(schema.pmsConfigurations).values(pmsConfigs).onConflictDoNothing();
      console.log('✅ PMS configurations migrated\n');
    }

    // 4. Migrate Arrivals
    console.log('📋 Migrating arrivals...');
    const arrivals = await sourceDb.select().from(schema.arrivals);
    console.log(`Found ${arrivals.length} arrivals`);
    if (arrivals.length > 0) {
      await targetDb.insert(schema.arrivals).values(arrivals).onConflictDoNothing();
      console.log('✅ Arrivals migrated\n');
    }

    // 5. Migrate Registration Contracts
    console.log('📋 Migrating registration contracts...');
    const contracts = await sourceDb.select().from(schema.registrationContracts);
    console.log(`Found ${contracts.length} contracts`);
    if (contracts.length > 0) {
      await targetDb.insert(schema.registrationContracts).values(contracts).onConflictDoNothing();
      console.log('✅ Contracts migrated\n');
    }

    // 6. Migrate Devices
    console.log('📋 Migrating devices...');
    const devices = await sourceDb.select().from(schema.devices);
    console.log(`Found ${devices.length} devices`);
    if (devices.length > 0) {
      await targetDb.insert(schema.devices).values(devices).onConflictDoNothing();
      console.log('✅ Devices migrated\n');
    }

    // 7. Migrate Contract Assignments
    console.log('📋 Migrating contract assignments...');
    const assignments = await sourceDb.select().from(schema.contractAssignments);
    console.log(`Found ${assignments.length} contract assignments`);
    if (assignments.length > 0) {
      await targetDb.insert(schema.contractAssignments).values(assignments).onConflictDoNothing();
      console.log('✅ Contract assignments migrated\n');
    }

    // 8. Migrate Login History
    console.log('📋 Migrating login history...');
    const loginHistory = await sourceDb.select().from(schema.loginHistory);
    console.log(`Found ${loginHistory.length} login records`);
    if (loginHistory.length > 0) {
      await targetDb.insert(schema.loginHistory).values(loginHistory).onConflictDoNothing();
      console.log('✅ Login history migrated\n');
    }

    // 9. Migrate OTP Codes
    console.log('📋 Migrating OTP codes...');
    const otpCodes = await sourceDb.select().from(schema.otpCodes);
    console.log(`Found ${otpCodes.length} OTP codes`);
    if (otpCodes.length > 0) {
      await targetDb.insert(schema.otpCodes).values(otpCodes).onConflictDoNothing();
      console.log('✅ OTP codes migrated\n');
    }

    console.log('✨ Migration completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- ${users.length} users`);
    console.log(`- ${hotels.length} hotels`);
    console.log(`- ${pmsConfigs.length} PMS configurations`);
    console.log(`- ${arrivals.length} arrivals`);
    console.log(`- ${contracts.length} contracts`);
    console.log(`- ${devices.length} devices`);
    console.log(`- ${assignments.length} contract assignments`);
    console.log(`- ${loginHistory.length} login records`);
    console.log(`- ${otpCodes.length} OTP codes`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

migrateData();
