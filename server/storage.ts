import { db } from "./db";
import { eq, and, or, like, desc, isNull, lt, sql } from "drizzle-orm";
import {
  users,
  hotels,
  pmsConfigurations,
  registrationContracts,
  arrivals,
  devices,
  contractAssignments,
  loginHistory,
  otpCodes,
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
  type LoginHistory,
  type InsertLoginHistory,
  type OtpCode,
  type InsertOtpCode,
} from "@shared/schema";

export interface IStorage {
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  updateUserLastLogin(id: string): Promise<void>;
  toggleUser2FA(id: string, enabled: boolean): Promise<User | undefined>;
  deleteUser(id: string): Promise<void>;
  
  // Login History
  createLoginHistory(history: InsertLoginHistory): Promise<LoginHistory>;
  getLoginHistoryByUser(userId: string, limit?: number): Promise<LoginHistory[]>;
  logoutSession(sessionId: string, userId?: string): Promise<void>;
  
  // OTP Codes
  createOtpCode(otp: InsertOtpCode): Promise<OtpCode>;
  getValidOtp(userId: string, code: string, type: string): Promise<OtpCode | undefined>;
  markOtpAsUsed(id: string): Promise<void>;
  deleteExpiredOtps(): Promise<void>;

  // Hotel management
  getHotel(id: string): Promise<Hotel | undefined>;
  getAllHotels(): Promise<Hotel[]>;
  createHotel(hotel: InsertHotel): Promise<Hotel>;
  updateHotel(id: string, hotel: Partial<InsertHotel>): Promise<Hotel | undefined>;
  updateHotelContractTerms(id: string, contractTerms: string): Promise<Hotel | undefined>;
  deleteHotel(id: string): Promise<void>;

  // PMS Configuration management
  getPmsConfiguration(hotelId: string): Promise<PmsConfiguration | undefined>;
  createPmsConfiguration(config: InsertPmsConfiguration): Promise<PmsConfiguration>;
  updatePmsConfiguration(id: string, config: Partial<InsertPmsConfiguration>): Promise<PmsConfiguration | undefined>;

  // Registration Contracts
  createContract(contract: InsertRegistrationContract): Promise<RegistrationContract>;
  getContract(id: string): Promise<RegistrationContract | undefined>;
  searchContracts(params: SearchContracts): Promise<RegistrationContract[]>;
  getRecentContracts(hotelId: string, limit?: number): Promise<RegistrationContract[]>;
  updateContractSignature(id: string, signatureDataUrl: string, email?: string, phone?: string): Promise<RegistrationContract | undefined>;

  // Arrivals management
  createArrival(arrival: InsertArrival): Promise<Arrival>;
  getArrival(id: string): Promise<Arrival | undefined>;
  getArrivalsByHotel(hotelId: string, date?: string): Promise<Arrival[]>;
  updateArrivalCheckInStatus(id: string, contractId: string): Promise<Arrival | undefined>;
  updateArrival(id: string, updates: Partial<InsertArrival>): Promise<Arrival | undefined>;
  deleteOldArrivals(hotelId: string, beforeDate: string): Promise<void>;
  deleteArrival(id: string): Promise<void>;
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

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(sql`LOWER(${users.email}) = LOWER(${email})`);
    return result[0];
  }

  async updateUser(id: string, userData: Partial<InsertUser>): Promise<User | undefined> {
    const result = await db.update(users).set(userData).where(eq(users.id, id)).returning();
    return result[0];
  }

  async updateUserLastLogin(id: string): Promise<void> {
    await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, id));
  }

  async toggleUser2FA(id: string, enabled: boolean): Promise<User | undefined> {
    const result = await db.update(users).set({ twoFactorEnabled: enabled }).where(eq(users.id, id)).returning();
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    const result = await db.select().from(users).orderBy(desc(users.createdAt));
    return result;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // Login History methods
  async createLoginHistory(history: InsertLoginHistory): Promise<LoginHistory> {
    const result = await db.insert(loginHistory).values(history).returning();
    return result[0];
  }

  async getLoginHistoryByUser(userId: string, limit: number = 5): Promise<LoginHistory[]> {
    const result = await db
      .select()
      .from(loginHistory)
      .where(eq(loginHistory.userId, userId))
      .orderBy(desc(loginHistory.loginAt))
      .limit(limit);
    return result;
  }

  async logoutSession(sessionId: string, userId?: string): Promise<void> {
    // If userId is provided, verify ownership first
    if (userId) {
      const session = await db
        .select()
        .from(loginHistory)
        .where(
          and(
            eq(loginHistory.sessionId, sessionId),
            eq(loginHistory.userId, userId),
            eq(loginHistory.loggedOut, false)
          )
        )
        .limit(1);
      
      if (session.length === 0) {
        throw new Error("Session not found or already logged out");
      }
    }
    
    // Update login history to mark as logged out
    await db
      .update(loginHistory)
      .set({ loggedOut: true, loggedOutAt: new Date() })
      .where(eq(loginHistory.sessionId, sessionId));
    
    // Delete from PostgreSQL session store
    await db.execute(sql`DELETE FROM session WHERE sid = ${sessionId}`);
  }

  // OTP Code methods
  async createOtpCode(otp: InsertOtpCode): Promise<OtpCode> {
    const result = await db.insert(otpCodes).values(otp).returning();
    return result[0];
  }

  async getValidOtp(userId: string, code: string, type: string): Promise<OtpCode | undefined> {
    const now = new Date();
    const result = await db
      .select()
      .from(otpCodes)
      .where(
        and(
          eq(otpCodes.userId, userId),
          eq(otpCodes.code, code),
          eq(otpCodes.type, type),
          isNull(otpCodes.usedAt)
        )
      )
      .orderBy(desc(otpCodes.expiresAt))
      .limit(1);
    
    const otp = result[0];
    if (otp && otp.expiresAt > now) {
      return otp;
    }
    return undefined;
  }

  async markOtpAsUsed(id: string): Promise<void> {
    await db.update(otpCodes).set({ usedAt: new Date() }).where(eq(otpCodes.id, id));
  }

  async deleteExpiredOtps(): Promise<void> {
    const now = new Date();
    await db.delete(otpCodes).where(lt(otpCodes.expiresAt, now));
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

  async deleteHotel(id: string): Promise<void> {
    await db.delete(hotels).where(eq(hotels.id, id));
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

  async updateContractSignature(
    id: string, 
    signatureDataUrl: string, 
    email?: string, 
    phone?: string
  ): Promise<RegistrationContract | undefined> {
    // First, check if contract exists
    const existingContract = await db
      .select()
      .from(registrationContracts)
      .where(eq(registrationContracts.id, id));
    
    if (existingContract.length === 0) {
      console.error("[Storage] Contract not found with id:", id);
      return undefined;
    }
    
    // Build update object with signature and optional contact info
    const updateData: any = {
      signatureDataUrl,
      status: "completed" as const,
      updatedAt: new Date()
    };
    
    if (email !== undefined && email !== null) {
      updateData.email = email;
    }
    
    if (phone !== undefined && phone !== null) {
      updateData.phone = phone;
    }
    
    const result = await db
      .update(registrationContracts)
      .set(updateData)
      .where(eq(registrationContracts.id, id))
      .returning();
    
    return result.length > 0 ? result[0] : undefined;
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

  async getArrival(id: string): Promise<Arrival | undefined> {
    const result = await db.select().from(arrivals).where(eq(arrivals.id, id));
    return result[0];
  }

  async getArrivalsByHotel(hotelId: string, date?: string): Promise<Arrival[]> {
    // If date is provided, filter by check-in date; otherwise return all arrivals
    const query = date
      ? db
          .select()
          .from(arrivals)
          .where(and(eq(arrivals.hotelId, hotelId), eq(arrivals.checkInDate, date)))
          .orderBy(desc(arrivals.checkInDate), desc(arrivals.estimatedArrivalTime))
      : db
          .select()
          .from(arrivals)
          .where(eq(arrivals.hotelId, hotelId))
          .orderBy(desc(arrivals.checkInDate), desc(arrivals.estimatedArrivalTime));
    
    return await query;
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

  async updateArrival(id: string, updates: Partial<InsertArrival>): Promise<Arrival | undefined> {
    const result = await db
      .update(arrivals)
      .set({
        ...updates,
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

  async deleteArrival(id: string): Promise<void> {
    await db.delete(arrivals).where(eq(arrivals.id, id));
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
    console.log(`[Storage] getDevicesByHotel called for hotelId: ${hotelId}`);
    
    // First, let's see ALL devices
    const allDevices = await db.select().from(devices);
    console.log(`[Storage] Total devices in database: ${allDevices.length}`);
    if (allDevices.length > 0) {
      console.log(`[Storage] Sample device structure:`, {
        id: allDevices[0].id,
        hotelId: allDevices[0].hotelId,
        deviceName: allDevices[0].deviceName,
      });
    }
    
    const result = await db
      .select()
      .from(devices)
      .where(eq(devices.hotelId, hotelId))
      .orderBy(desc(devices.lastSeen));
    console.log(`[Storage] getDevicesByHotel returned ${result.length} devices for hotelId=${hotelId}`);
    if (result.length > 0) {
      console.log(`[Storage] Devices:`, result.map(d => ({ id: d.id, name: d.deviceName, online: d.isOnline })));
    }
    return result;
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
