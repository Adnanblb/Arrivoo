import { db } from "./db";
import { eq, and, or, like, desc } from "drizzle-orm";
import {
  users,
  hotels,
  pmsConfigurations,
  registrationContracts,
  arrivals,
  devices,
  contractAssignments,
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
  type Device,
  type InsertDevice,
  type ContractAssignment,
  type InsertContractAssignment,
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
  updateHotelContractTerms(id: string, contractTerms: string): Promise<Hotel | undefined>;

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

  // Device management (tablets/iPads)
  createDevice(device: InsertDevice): Promise<Device>;
  getDevice(id: string): Promise<Device | undefined>;
  getDevicesByHotel(hotelId: string): Promise<Device[]>;
  updateDevice(id: string, device: Partial<InsertDevice>): Promise<Device | undefined>;
  updateDeviceSocketId(id: string, socketId: string | null, isOnline: boolean, metadata?: { browser?: string; os?: string; screenSize?: string }): Promise<Device | undefined>;
  deleteDevice(id: string): Promise<void>;

  // Contract Assignments (send to tablet)
  createContractAssignment(assignment: InsertContractAssignment): Promise<ContractAssignment>;
  getContractAssignment(contractId: string): Promise<ContractAssignment | undefined>;
  updateContractAssignmentStatus(id: string, status: string, timestamp?: Date): Promise<ContractAssignment | undefined>;
  getAssignmentsByDevice(deviceId: string): Promise<ContractAssignment[]>;
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

  async updateHotelContractTerms(id: string, contractTerms: string): Promise<Hotel | undefined> {
    const result = await db
      .update(hotels)
      .set({ contractTerms })
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
    // If date is provided, filter by check-in date; otherwise return all arrivals
    const query = date
      ? db
          .select()
          .from(arrivals)
          .where(and(eq(arrivals.hotelId, hotelId), eq(arrivals.checkInDate, date)))
      : db
          .select()
          .from(arrivals)
          .where(eq(arrivals.hotelId, hotelId));
    
    return await query.orderBy(desc(arrivals.checkInDate), desc(arrivals.estimatedArrivalTime));
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
    // Use INSERT ... ON CONFLICT DO UPDATE to handle duplicate arrivals during hourly sync
    const result = await db
      .insert(arrivals)
      .values(arrival)
      .onConflictDoUpdate({
        target: [arrivals.hotelId, arrivals.reservationNumber, arrivals.checkInDate],
        set: {
          guestName: arrival.guestName,
          email: arrival.email,
          phoneNumber: arrival.phoneNumber,
          address: arrival.address,
          roomType: arrival.roomType,
          roomNumber: arrival.roomNumber,
          checkOutDate: arrival.checkOutDate,
          numberOfNights: arrival.numberOfNights,
          estimatedArrivalTime: arrival.estimatedArrivalTime,
          pmsSource: arrival.pmsSource,
          syncedAt: new Date(),
          updatedAt: new Date(),
        },
      })
      .returning();
    
    return result[0];
  }

  // Device methods
  async createDevice(device: InsertDevice): Promise<Device> {
    const result = await db.insert(devices).values(device).returning();
    return result[0];
  }

  async getDevice(id: string): Promise<Device | undefined> {
    const result = await db.select().from(devices).where(eq(devices.id, id));
    return result[0];
  }

  async getDevicesByHotel(hotelId: string): Promise<Device[]> {
    return await db
      .select()
      .from(devices)
      .where(eq(devices.hotelId, hotelId))
      .orderBy(desc(devices.lastSeen));
  }

  async updateDevice(id: string, device: Partial<InsertDevice>): Promise<Device | undefined> {
    const result = await db
      .update(devices)
      .set({ ...device, updatedAt: new Date() })
      .where(eq(devices.id, id))
      .returning();
    return result[0];
  }

  async updateDeviceSocketId(id: string, socketId: string | null, isOnline: boolean, metadata?: { browser?: string; os?: string; screenSize?: string }): Promise<Device | undefined> {
    const updateData: any = {
      socketId,
      isOnline,
      lastSeen: new Date(),
      updatedAt: new Date(),
    };
    
    // Add metadata if provided
    if (metadata) {
      if (metadata.browser) updateData.browser = metadata.browser;
      if (metadata.os) updateData.os = metadata.os;
      if (metadata.screenSize) updateData.screenSize = metadata.screenSize;
    }
    
    const result = await db
      .update(devices)
      .set(updateData)
      .where(eq(devices.id, id))
      .returning();
    return result[0];
  }

  async deleteDevice(id: string): Promise<void> {
    await db.delete(devices).where(eq(devices.id, id));
  }

  // Contract Assignment methods
  async createContractAssignment(assignment: InsertContractAssignment): Promise<ContractAssignment> {
    const result = await db.insert(contractAssignments).values(assignment).returning();
    return result[0];
  }

  async getContractAssignment(contractId: string): Promise<ContractAssignment | undefined> {
    const result = await db
      .select()
      .from(contractAssignments)
      .where(eq(contractAssignments.contractId, contractId))
      .orderBy(desc(contractAssignments.sentAt));
    return result[0];
  }

  async updateContractAssignmentStatus(
    id: string,
    status: string,
    timestamp?: Date
  ): Promise<ContractAssignment | undefined> {
    const updates: any = { status };
    
    if (status === "viewing" && timestamp) {
      updates.viewedAt = timestamp;
    } else if (status === "signed" && timestamp) {
      updates.signedAt = timestamp;
    } else if (status === "completed" && timestamp) {
      updates.completedAt = timestamp;
    }

    const result = await db
      .update(contractAssignments)
      .set(updates)
      .where(eq(contractAssignments.id, id))
      .returning();
    return result[0];
  }

  async getAssignmentsByDevice(deviceId: string): Promise<ContractAssignment[]> {
    return await db
      .select()
      .from(contractAssignments)
      .where(eq(contractAssignments.deviceId, deviceId))
      .orderBy(desc(contractAssignments.sentAt));
  }
}

export const storage = new DbStorage();
