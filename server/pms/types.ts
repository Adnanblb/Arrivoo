import type { PmsReservation } from "@shared/schema";

// Arrival information fetched from PMS for auto-sync
export interface PmsArrival {
  reservationNumber: string;
  guestName: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  roomType?: string;
  roomNumber?: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfNights: number;
  estimatedArrivalTime?: string;
}

// Base interface that all PMS connectors must implement
export interface IPmsConnector {
  // Lookup reservation by confirmation number
  lookupReservation(confirmationNumber: string): Promise<PmsReservation | null>;
  
  // Get today's arrivals for automatic sync
  getArrivals(date: Date): Promise<PmsArrival[]>;
  
  // Test connection to PMS
  testConnection(): Promise<boolean>;
  
  // Get PMS type identifier
  getPmsType(): string;
}

// Configuration for each PMS type
export interface PmsCredentials {
  apiKey?: string;
  apiSecret?: string;
  username?: string;
  password?: string;
  hotelId?: string;
  chainCode?: string;
  propertyCode?: string;
  [key: string]: any; // Allow additional fields
}

export interface PmsConfig {
  pmsType: string;
  apiEndpoint: string;
  credentials: PmsCredentials;
}
