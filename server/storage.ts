import { db } from "./db";
import { eq, and, or, like, desc } from "drizzle-orm";
import {
  users,
  hotels,
  pmsConfigurations,
  registrationContracts,
  type User,
  type InsertUser,
  type Hotel,
  type InsertHotel,
  type PmsConfiguration,
  type InsertPmsConfiguration,
  type RegistrationContract,
  type InsertRegistrationContract,
  type SearchContracts,
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
}

export const storage = new DbStorage();
