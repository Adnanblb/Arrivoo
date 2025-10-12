import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, json, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  hotelName: text("hotel_name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(), // Hashed password
  role: text("role").notNull().default("hotel_staff"), // admin, hotel_staff
  hotelId: varchar("hotel_id"),
  logoUrl: text("logo_url"), // Hotel logo URL
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Login History table
export const loginHistory = pgTable("login_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  loginAt: timestamp("login_at").defaultNow(),
  ipAddress: text("ip_address"),
  deviceType: text("device_type"), // Mobile, Desktop, Tablet
  browser: text("browser"),
  os: text("os"),
  status: text("status").notNull().default("success"), // success, failed
  sessionId: text("session_id"),
  loggedOut: boolean("logged_out").default(false),
  loggedOutAt: timestamp("logged_out_at"),
});

export const insertLoginHistorySchema = createInsertSchema(loginHistory).omit({
  id: true,
  loginAt: true,
});

export type InsertLoginHistory = z.infer<typeof insertLoginHistorySchema>;
export type LoginHistory = typeof loginHistory.$inferSelect;

// OTP Codes table
export const otpCodes = pgTable("otp_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  code: text("code").notNull(), // 6-digit code
  type: text("type").notNull(), // login, password_reset, two_factor
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertOtpCodeSchema = createInsertSchema(otpCodes).omit({
  id: true,
  createdAt: true,
  usedAt: true,
});

export type InsertOtpCode = z.infer<typeof insertOtpCodeSchema>;
export type OtpCode = typeof otpCodes.$inferSelect;

// Hotels table
export const hotels = pgTable("hotels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  logoUrl: text("logo_url"), // Hotel logo URL
  contractTerms: text("contract_terms"), // Custom contract terms for guest registration
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertHotelSchema = createInsertSchema(hotels).omit({
  id: true,
  createdAt: true,
});

export type InsertHotel = z.infer<typeof insertHotelSchema>;
export type Hotel = typeof hotels.$inferSelect;

// PMS Configurations table - supports multiple PMS types
export const pmsConfigurations = pgTable("pms_configurations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  hotelId: varchar("hotel_id").notNull(),
  pmsType: text("pms_type").notNull(), // opera_cloud, protel, cloudbeds, etc.
  apiEndpoint: text("api_endpoint"),
  credentials: json("credentials"), // Encrypted JSON with API keys/credentials
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPmsConfigurationSchema = createInsertSchema(pmsConfigurations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPmsConfiguration = z.infer<typeof insertPmsConfigurationSchema>;
export type PmsConfiguration = typeof pmsConfigurations.$inferSelect;

// Registration Contracts table - stores all signed registration forms
export const registrationContracts = pgTable("registration_contracts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  hotelId: varchar("hotel_id").notNull(),
  
  // Guest Information
  guestName: text("guest_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  idNumber: text("id_number"), // Passport or ID number
  
  // Reservation Details
  reservationNumber: text("reservation_number").notNull(),
  confirmationNumber: text("confirmation_number"),
  roomNumber: text("room_number"),
  roomType: text("room_type"),
  
  // Dates
  arrivalDate: text("arrival_date").notNull(),
  departureDate: text("departure_date").notNull(),
  numberOfNights: integer("number_of_nights"),
  
  // Registration Details
  signatureDataUrl: text("signature_data_url"), // Base64 encoded signature image
  registeredAt: timestamp("registered_at").defaultNow(),
  registeredBy: varchar("registered_by"), // Staff user ID
  
  // PMS Integration
  pmsSource: text("pms_source"), // opera_cloud, protel, cloudbeds, manual
  pmsReservationId: text("pms_reservation_id"), // External PMS ID
  
  // Additional fields
  specialRequests: text("special_requests"),
  numberOfGuests: integer("number_of_guests"),
  status: text("status").default("completed"), // completed, pending, cancelled
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertRegistrationContractSchema = createInsertSchema(registrationContracts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertRegistrationContract = z.infer<typeof insertRegistrationContractSchema>;
export type RegistrationContract = typeof registrationContracts.$inferSelect;

// Search schema for contracts
export const searchContractsSchema = z.object({
  hotelId: z.string(),
  guestName: z.string().optional(),
  roomNumber: z.string().optional(),
  reservationNumber: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export type SearchContracts = z.infer<typeof searchContractsSchema>;

// Arrivals table - stores synced arrival data from PMS
export const arrivals = pgTable("arrivals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  hotelId: varchar("hotel_id").notNull(),
  
  // Guest Information (from PMS)
  reservationNumber: text("reservation_number").notNull(),
  guestName: text("guest_name").notNull(),
  email: text("email"),
  phoneNumber: text("phone_number"),
  address: text("address"),
  
  // Room Details
  roomType: text("room_type"),
  roomNumber: text("room_number"),
  
  // Dates
  checkInDate: text("check_in_date").notNull(),
  checkOutDate: text("check_out_date").notNull(),
  numberOfNights: integer("number_of_nights"),
  estimatedArrivalTime: text("estimated_arrival_time"),
  
  // PMS sync tracking
  pmsSource: text("pms_source").notNull(), // opera_cloud, protel, cloudbeds
  syncedAt: timestamp("synced_at").defaultNow(),
  
  // Status tracking
  hasCheckedIn: boolean("has_checked_in").default(false),
  checkedInAt: timestamp("checked_in_at"),
  contractId: varchar("contract_id"), // Link to registration contract if checked in
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // Unique constraint to prevent duplicate arrivals during hourly sync
  uniqueArrival: unique("unique_arrival_per_hotel").on(table.hotelId, table.reservationNumber, table.checkInDate),
}));

export const insertArrivalSchema = createInsertSchema(arrivals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  syncedAt: true,
});

export type InsertArrival = z.infer<typeof insertArrivalSchema>;
export type Arrival = typeof arrivals.$inferSelect;

// PMS Lookup Request schema
export const pmsLookupSchema = z.object({
  confirmationNumber: z.string().min(1, "Confirmation number is required"),
  hotelId: z.string(),
});

export type PmsLookup = z.infer<typeof pmsLookupSchema>;

// PMS Reservation Response schema (what we get from PMS API)
export const pmsReservationSchema = z.object({
  guestName: z.string(),
  reservationNumber: z.string(),
  confirmationNumber: z.string(),
  arrivalDate: z.string(),
  departureDate: z.string(),
  roomType: z.string().optional(),
  roomNumber: z.string().optional(),
  numberOfNights: z.number(),
  email: z.string().optional(),
  phone: z.string().optional(),
  numberOfGuests: z.number().optional(),
  specialRequests: z.string().optional(),
});

export type PmsReservation = z.infer<typeof pmsReservationSchema>;

// Devices table - tracks tablets/iPads registered to hotels
export const devices = pgTable("devices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  hotelId: varchar("hotel_id").notNull(),
  deviceName: text("device_name").notNull(), // User-friendly name (e.g., "Front Desk iPad 1")
  deviceType: text("device_type").default("tablet"), // tablet, desktop
  socketId: text("socket_id"), // Current WebSocket connection ID
  isOnline: boolean("is_online").default(false),
  lastSeen: timestamp("last_seen").defaultNow(),
  
  // Device metadata for better identification
  browser: text("browser"), // Chrome, Safari, Firefox, etc.
  os: text("os"), // iOS, Android, Windows, macOS, etc.
  screenSize: text("screen_size"), // e.g., "1024x768"
  ipAddress: text("ip_address"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDeviceSchema = createInsertSchema(devices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastSeen: true,
  socketId: true,
  isOnline: true,
});

export type InsertDevice = z.infer<typeof insertDeviceSchema>;
export type Device = typeof devices.$inferSelect;

// Contract Assignments - tracks which contract is sent to which device
export const contractAssignments = pgTable("contract_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractId: varchar("contract_id").notNull(),
  deviceId: varchar("device_id").notNull(),
  hotelId: varchar("hotel_id").notNull(),
  status: text("status").default("sent"), // sent, viewing, signed, completed
  sentAt: timestamp("sent_at").defaultNow(),
  viewedAt: timestamp("viewed_at"),
  signedAt: timestamp("signed_at"),
  completedAt: timestamp("completed_at"),
});

export const insertContractAssignmentSchema = createInsertSchema(contractAssignments).omit({
  id: true,
  sentAt: true,
});

export type InsertContractAssignment = z.infer<typeof insertContractAssignmentSchema>;
export type ContractAssignment = typeof contractAssignments.$inferSelect;

// Authentication Schemas
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginRequest = z.infer<typeof loginSchema>;

export const verifyOtpSchema = z.object({
  userId: z.string(),
  code: z.string().length(6, "OTP must be 6 digits"),
  type: z.enum(["login", "password_reset", "two_factor"]),
});

export type VerifyOtpRequest = z.infer<typeof verifyOtpSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export type ForgotPasswordRequest = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  userId: z.string(),
  code: z.string().length(6, "OTP must be 6 digits"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export type ResetPasswordRequest = z.infer<typeof resetPasswordSchema>;

export const toggle2FASchema = z.object({
  enabled: z.boolean(),
});

export type Toggle2FARequest = z.infer<typeof toggle2FASchema>;
