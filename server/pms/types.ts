import type { PmsReservation } from "@shared/schema";

// Base interface that all PMS connectors must implement
export interface IPmsConnector {
  // Lookup reservation by confirmation number
  lookupReservation(confirmationNumber: string): Promise<PmsReservation | null>;
  
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
