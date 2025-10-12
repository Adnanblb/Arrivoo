import cron from "node-cron";
import { pmsSyncService } from "./pms-sync";

/**
 * Set up all cron jobs for the application
 * - Hourly PMS sync (5:00 AM - 5:00 AM)
 * - Daily cleanup of old arrivals
 */
export function setupCronJobs() {
  console.log("[Cron] Setting up scheduled jobs...");

  // Hourly sync: runs every hour on the hour
  // This fetches "Arrivals Today" from all hotel PMS systems
  cron.schedule("0 * * * *", async () => {
    console.log("[Cron] Running hourly PMS sync...");
    try {
      await pmsSyncService.syncAllHotels();
    } catch (error) {
      console.error("[Cron] Error during hourly PMS sync:", error);
    }
  });

  // Daily cleanup: runs at 2:00 AM every day
  // Removes arrivals older than 5 years to keep database size manageable
  cron.schedule("0 2 * * *", async () => {
    console.log("[Cron] Running daily cleanup of old arrivals...");
    try {
      await pmsSyncService.cleanupOldArrivals();
    } catch (error) {
      console.error("[Cron] Error during cleanup:", error);
    }
  });

  console.log("[Cron] Scheduled jobs:");
  console.log("  - Hourly PMS sync: Every hour on the hour");
  console.log("  - Daily cleanup: Every day at 2:00 AM");
  
  // Run initial sync on startup (optional, but helpful for testing)
  console.log("[Cron] Running initial PMS sync on startup...");
  pmsSyncService.syncAllHotels().catch(error => {
    console.error("[Cron] Error during initial sync:", error);
  });
}
