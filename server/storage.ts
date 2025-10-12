import { db } from "./db";
import { eq, and, or, like, desc } from "drizzle-orm";
import {
  users,
  hotels,
  pmsConfigurations,
  registrationContracts,
  arrivals,
  type User,
  type InsertUser,
  type Hotel,
  type InsertHotel,
  type PmsConfiguration,
  type InsertPmsConfiguration,
  type RegistrationContract,
  type InsertRegistrationContract,
  type SearchContracts,
  type Arrival,
  type InsertArrival,
} from "@shared/schema";

export interface IStorage {
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Hotel management
  getHotel(id: string): Promise<Hotel | undefined>;
  getAllHotels(): Promise<Hotel[]>;
  createHotel(hotel: InsertHotel): Promise<Hotel>;
  updateHotel(id: string, hotel: Partial<InsertHotel>): Promise<Hotel | undefined>;

  // PMS Configuration management
  getPmsConfiguration(hotelId: string): Promise<PmsConfiguration | undefined>;
  createPmsConfiguration(config: InsertPmsConfiguration): Promise<PmsConfiguration>;
  updatePmsConfiguration(id: string, config: Partial<InsertPmsConfiguration>): Promise<PmsConfiguration | undefined>;

  // Registration Contracts
  createContract(contract: InsertRegistrationContract): Promise<RegistrationContract>;
  getContract(id: string): Promise<RegistrationContract | undefined>;
  searchContracts(params: SearchContracts): Promise<RegistrationContract[]>;
  getRecentContracts(hotelId: string, limit?: number): Promise<RegistrationContract[]>;

  // Arrivals management
  createArrival(arrival: InsertArrival): Promise<Arrival>;
  getArrivalsByHotel(hotelId: string, date?: string): Promise<Arrival[]>;
  updateArrivalCheckInStatus(id: string, contractId: string): Promise<Arrival | undefined>;
  deleteOldArrivals(hotelId: string, beforeDate: string): Promise<void>;
  upsertArrival(arrival: InsertArrival): Promise<Arrival>;
}

export class DbStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  // Hotel methods
  async getHotel(id: string): Promise<Hotel | undefined> {
    const result = await db.select().from(hotels).where(eq(hotels.id, id));
    return result[0];
  }

  async getAllHotels(): Promise<Hotel[]> {
    return await db.select().from(hotels);
  }

  async createHotel(hotel: InsertHotel): Promise<Hotel> {
    const result = await db.insert(hotels).values(hotel).returning();
    return result[0];
  }

  async updateHotel(id: string, hotel: Partial<InsertHotel>): Promise<Hotel | undefined> {
    const result = await db
      .update(hotels)
      .set(hotel)
      .where(eq(hotels.id, id))
      .returning();
    return result[0];
  }

  // PMS Configuration methods
  async getPmsConfiguration(hotelId: string): Promise<PmsConfiguration | undefined> {
    const result = await db
      .select()
      .from(pmsConfigurations)
      .where(and(eq(pmsConfigurations.hotelId, hotelId), eq(pmsConfigurations.isActive, true)));
    return result[0];
  }

  async createPmsConfiguration(config: InsertPmsConfiguration): Promise<PmsConfiguration> {
    const result = await db.insert(pmsConfigurations).values(config).returning();
    return result[0];
  }

  async updatePmsConfiguration(
    id: string,
    config: Partial<InsertPmsConfiguration>
  ): Promise<PmsConfiguration | undefined> {
    const result = await db
      .update(pmsConfigurations)
      .set({ ...config, updatedAt: new Date() })
      .where(eq(pmsConfigurations.id, id))
      .returning();
    return result[0];
  }

  // Registration Contract methods
  async createContract(contract: InsertRegistrationContract): Promise<RegistrationContract> {
    const result = await db.insert(registrationContracts).values(contract).returning();
    return result[0];
  }

  async getContract(id: string): Promise<RegistrationContract | undefined> {
    const result = await db
      .select()
      .from(registrationContracts)
      .where(eq(registrationContracts.id, id));
    return result[0];
  }

  async searchContracts(params: SearchContracts): Promise<RegistrationContract[]> {
    const conditions = [eq(registrationContracts.hotelId, params.hotelId)];

    if (params.guestName) {
      conditions.push(like(registrationContracts.guestName, `%${params.guestName}%`));
    }

    if (params.roomNumber) {
      conditions.push(like(registrationContracts.roomNumber, `%${params.roomNumber}%`));
    }

    if (params.reservationNumber) {
      conditions.push(like(registrationContracts.reservationNumber, `%${params.reservationNumber}%`));
    }

    if (params.dateFrom) {
      conditions.push(eq(registrationContracts.arrivalDate, params.dateFrom));
    }

    return await db
      .select()
      .from(registrationContracts)
      .where(and(...conditions))
      .orderBy(desc(registrationContracts.registeredAt));
  }

  async getRecentContracts(hotelId: string, limit: number = 50): Promise<RegistrationContract[]> {
    return await db
      .select()
      .from(registrationContracts)
      .where(eq(registrationContracts.hotelId, hotelId))
      .orderBy(desc(registrationContracts.registeredAt))
      .limit(limit);
  }

  // Arrivals methods
  async createArrival(arrival: InsertArrival): Promise<Arrival> {
    const result = await db.insert(arrivals).values(arrival).returning();
    return result[0];
  }

  async getArrivalsByHotel(hotelId: string, date?: string): Promise<Arrival[]> {
    const conditions = [eq(arrivals.hotelId, hotelId)];
    
    if (date) {
      conditions.push(eq(arrivals.checkInDate, date));
    }
    
    return await db
      .select()
      .from(arrivals)
      .where(and(...conditions))
      .orderBy(desc(arrivals.estimatedArrivalTime));
  }

  async updateArrivalCheckInStatus(id: string, contractId: string): Promise<Arrival | undefined> {
    const result = await db
      .update(arrivals)
      .set({
        hasCheckedIn: true,
        checkedInAt: new Date(),
        contractId: contractId,
        updatedAt: new Date(),
      })
      .where(eq(arrivals.id, id))
      .returning();
    return result[0];
  }

  async deleteOldArrivals(hotelId: string, beforeDate: string): Promise<void> {
    await db
      .delete(arrivals)
      .where(
        and(
          eq(arrivals.hotelId, hotelId),
          like(arrivals.checkInDate, `%${beforeDate}%`)
        )
      );
  }

  async upsertArrival(arrival: InsertArrival): Promise<Arrival> {
    // Check if arrival already exists by reservation number and check-in date
    const existing = await db
      .select()
      .from(arrivals)
      .where(
        and(
          eq(arrivals.hotelId, arrival.hotelId),
          eq(arrivals.reservationNumber, arrival.reservationNumber),
          eq(arrivals.checkInDate, arrival.checkInDate)
        )
      );

    if (existing.length > 0) {
      // Update existing arrival
      const result = await db
        .update(arrivals)
        .set({ ...arrival, updatedAt: new Date() })
        .where(eq(arrivals.id, existing[0].id))
        .returning();
      return result[0];
    } else {
      // Create new arrival
      return await this.createArrival(arrival);
    }
  }
}

export const storage = new DbStorage();
