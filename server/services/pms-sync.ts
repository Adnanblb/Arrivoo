import { storage } from "../storage";
import { PmsFactory } from "../pms/pms-factory";
import type { PmsArrival } from "../pms/types";
import type { InsertArrival } from "@shared/schema";

export class PmsSyncService {
  /**
   * Sync arrivals for all hotels from their configured PMS
   * This is called hourly by the cron job
   */
  async syncAllHotels(): Promise<void> {
    console.log("[PMS Sync] Starting hourly sync for all hotels...");
    
    try {
      const hotels = await storage.getAllHotels();
      const today = new Date();
      
      for (const hotel of hotels) {
        try {
          await this.syncHotelArrivals(hotel.id, today);
        } catch (error) {
          console.error(`[PMS Sync] Error syncing hotel ${hotel.id}:`, error);
          // Continue with other hotels even if one fails
        }
      }
      
      console.log("[PMS Sync] Completed sync for all hotels");
    } catch (error) {
      console.error("[PMS Sync] Error during sync:", error);
    }
  }

  /**
   * Sync arrivals for a specific hotel
   */
  async syncHotelArrivals(hotelId: string, date: Date): Promise<number> {
    console.log(`[PMS Sync] Syncing arrivals for hotel ${hotelId}...`);
    
    // Get PMS configuration for this hotel
    const pmsConfig = await storage.getPmsConfiguration(hotelId);
    
    if (!pmsConfig) {
      console.log(`[PMS Sync] No PMS configuration found for hotel ${hotelId}`);
      return 0;
    }

    try {
      // Create PMS connector for this hotel
      const connector = PmsFactory.createConnector({
        pmsType: pmsConfig.pmsType,
        apiEndpoint: pmsConfig.apiEndpoint || "",
        credentials: pmsConfig.credentials || {},
      });

      // Fetch arrivals from PMS
      const pmsArrivals = await connector.getArrivals(date);
      console.log(`[PMS Sync] Fetched ${pmsArrivals.length} arrivals from PMS for hotel ${hotelId}`);

      // Upsert each arrival into the database
      let syncedCount = 0;
      for (const pmsArrival of pmsArrivals) {
        try {
          const arrival: InsertArrival = {
            hotelId,
            reservationNumber: pmsArrival.reservationNumber,
            guestName: pmsArrival.guestName,
            email: pmsArrival.email,
            phoneNumber: pmsArrival.phoneNumber,
            address: pmsArrival.address,
            roomType: pmsArrival.roomType,
            roomNumber: pmsArrival.roomNumber,
            checkInDate: pmsArrival.checkInDate,
            checkOutDate: pmsArrival.checkOutDate,
            numberOfNights: pmsArrival.numberOfNights,
            estimatedArrivalTime: pmsArrival.estimatedArrivalTime,
            pmsSource: pmsConfig.pmsType,
            hasCheckedIn: false,
          };

          await storage.upsertArrival(arrival);
          syncedCount++;
        } catch (error) {
          console.error(`[PMS Sync] Error upserting arrival ${pmsArrival.reservationNumber}:`, error);
        }
      }

      console.log(`[PMS Sync] Synced ${syncedCount} arrivals for hotel ${hotelId}`);
      return syncedCount;
    } catch (error) {
      console.error(`[PMS Sync] Error syncing arrivals for hotel ${hotelId}:`, error);
      return 0;
    }
  }

  /**
   * Clean up old arrivals (older than 5 years)
   * This helps keep the database size manageable
   */
  async cleanupOldArrivals(): Promise<void> {
    console.log("[PMS Sync] Cleaning up old arrivals...");
    
    try {
      const hotels = await storage.getAllHotels();
      const fiveYearsAgo = new Date();
      fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
      const cutoffDate = fiveYearsAgo.toISOString().split('T')[0];
      
      for (const hotel of hotels) {
        try {
          await storage.deleteOldArrivals(hotel.id, cutoffDate);
        } catch (error) {
          console.error(`[PMS Sync] Error cleaning old arrivals for hotel ${hotel.id}:`, error);
        }
      }
      
      console.log("[PMS Sync] Completed cleanup of old arrivals");
    } catch (error) {
      console.error("[PMS Sync] Error during cleanup:", error);
    }
  }
}

export const pmsSyncService = new PmsSyncService();
