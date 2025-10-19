import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { PmsFactory } from "./pms/pms-factory";
import { PdfGenerator } from "./services/pdf-generator";
import { registerAuthRoutes } from "./auth-routes";
import {
  pmsLookupSchema,
  insertRegistrationContractSchema,
  searchContractsSchema,
  insertHotelSchema,
  insertPmsConfigurationSchema,
  insertDeviceSchema,
  insertContractAssignmentSchema,
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Register authentication routes
  registerAuthRoutes(app, storage);
  // PMS Lookup - Manual Check-in
  app.post("/api/pms/lookup", async (req, res) => {
    try {
      const { confirmationNumber, hotelId } = pmsLookupSchema.parse(req.body);

      // Get PMS configuration for the hotel
      const pmsConfig = await storage.getPmsConfiguration(hotelId);

      if (!pmsConfig) {
        return res.status(404).json({
          error: "PMS configuration not found for this hotel",
        });
      }

      // Create PMS connector
      const connector = PmsFactory.createConnector({
        pmsType: pmsConfig.pmsType,
        apiEndpoint: pmsConfig.apiEndpoint || "",
        credentials: pmsConfig.credentials as any,
      });

      // Lookup reservation
      const reservation = await connector.lookupReservation(confirmationNumber);

      if (!reservation) {
        return res.status(404).json({
          error: "Reservation not found",
          message: "No reservation found with the provided confirmation number",
        });
      }

      res.json(reservation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("PMS lookup error:", error);
      res.status(500).json({ error: "Failed to lookup reservation" });
    }
  });

  // Create Manual Check-In Contract
  app.post("/api/contracts/manual", async (req, res) => {
    try {
      const { hotelId, guestName, roomNumber, arrivalDate, departureDate, numberOfNights } = req.body;

      // Validate required fields
      if (!hotelId || !guestName || !roomNumber || !arrivalDate) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Calculate departure date if numberOfNights is provided
      let finalDepartureDate = departureDate;
      let finalNumberOfNights = numberOfNights;

      if (!departureDate && numberOfNights) {
        const checkInDate = new Date(arrivalDate);
        checkInDate.setDate(checkInDate.getDate() + numberOfNights);
        finalDepartureDate = checkInDate.toISOString().split('T')[0];
      } else if (departureDate && !numberOfNights) {
        const checkIn = new Date(arrivalDate);
        const checkOut = new Date(departureDate);
        const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
        finalNumberOfNights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      // Generate a reservation number
      const reservationNumber = `MAN-${Date.now()}`;

      // Create the contract
      const contractData = {
        hotelId,
        guestName,
        roomNumber,
        arrivalDate,
        departureDate: finalDepartureDate,
        numberOfNights: finalNumberOfNights,
        reservationNumber,
        status: "pending",
        pmsSource: "manual",
      };

      const contract = await storage.createContract(contractData);

      // Also create an arrival entry so it appears in the dashboard
      const arrivalData = {
        hotelId,
        reservationNumber,
        guestName,
        roomNumber,
        checkInDate: arrivalDate,
        checkOutDate: finalDepartureDate,
        numberOfNights: finalNumberOfNights,
        pmsSource: "manual",
        hasCheckedIn: false,
        contractId: contract.id,
      };

      await storage.createArrival(arrivalData);

      res.json(contract);
    } catch (error) {
      console.error("Create manual contract error:", error);
      res.status(500).json({ error: "Failed to create manual contract" });
    }
  });

  // Create Registration Contract
  app.post("/api/contracts", async (req, res) => {
    try {
      const contractData = insertRegistrationContractSchema.parse(req.body);
      const contract = await storage.createContract(contractData);
      res.json(contract);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Create contract error:", error);
      res.status(500).json({ error: "Failed to create contract" });
    }
  });

  // Search Contracts
  app.get("/api/contracts/search", async (req, res) => {
    try {
      const params = searchContractsSchema.parse({
        hotelId: req.query.hotelId,
        guestName: req.query.guestName,
        roomNumber: req.query.roomNumber,
        reservationNumber: req.query.reservationNumber,
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo,
      });

      const contracts = await storage.searchContracts(params);
      res.json(contracts);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Search contracts error:", error);
      res.status(500).json({ error: "Failed to search contracts" });
    }
  });

  // Get Recent Contracts
  app.get("/api/contracts/recent/:hotelId", async (req, res) => {
    try {
      const { hotelId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const contracts = await storage.getRecentContracts(hotelId, limit);
      res.json(contracts);
    } catch (error) {
      console.error("Get recent contracts error:", error);
      res.status(500).json({ error: "Failed to get recent contracts" });
    }
  });

  // Get Single Contract
  app.get("/api/contracts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const contract = await storage.getContract(id);

      if (!contract) {
        return res.status(404).json({ error: "Contract not found" });
      }

      res.json(contract);
    } catch (error) {
      console.error("Get contract error:", error);
      res.status(500).json({ error: "Failed to get contract" });
    }
  });

  // Download Contract as PDF
  app.get("/api/contracts/:id/pdf", async (req, res) => {
    try {
      const { id } = req.params;
      const contract = await storage.getContract(id);

      if (!contract) {
        return res.status(404).json({ error: "Contract not found" });
      }

      // Fetch hotel to get contract terms
      let hotelTerms: string | undefined;
      try {
        const hotel = await storage.getHotel(contract.hotelId);
        hotelTerms = hotel?.contractTerms || undefined;
      } catch (error) {
        console.error("Failed to fetch hotel terms:", error);
        // Continue without terms if fetch fails
      }

      // Generate and stream PDF to response
      await PdfGenerator.generateContractPdf(contract, res, hotelTerms);
    } catch (error) {
      console.error("Generate PDF error:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to generate PDF" });
      }
    }
  });

  // Hotel Management
  app.get("/api/hotels", async (req, res) => {
    try {
      const hotels = await storage.getAllHotels();
      res.json(hotels);
    } catch (error) {
      console.error("Get hotels error:", error);
      res.status(500).json({ error: "Failed to get hotels" });
    }
  });

  app.post("/api/hotels", async (req, res) => {
    try {
      const hotelData = insertHotelSchema.parse(req.body);
      const hotel = await storage.createHotel(hotelData);
      res.json(hotel);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Create hotel error:", error);
      res.status(500).json({ error: "Failed to create hotel" });
    }
  });

  app.get("/api/hotels/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const hotel = await storage.getHotel(id);

      if (!hotel) {
        return res.status(404).json({ error: "Hotel not found" });
      }

      res.json(hotel);
    } catch (error) {
      console.error("Get hotel error:", error);
      res.status(500).json({ error: "Failed to get hotel" });
    }
  });

  app.patch("/api/hotels/:id/contract-terms", async (req, res) => {
    try {
      const { id } = req.params;
      const { contractTerms } = z.object({
        contractTerms: z.string(),
      }).parse(req.body);

      const hotel = await storage.updateHotelContractTerms(id, contractTerms);

      if (!hotel) {
        return res.status(404).json({ error: "Hotel not found" });
      }

      res.json(hotel);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Update hotel contract terms error:", error);
      res.status(500).json({ error: "Failed to update contract terms" });
    }
  });

  // PMS Configuration Management
  app.get("/api/pms-config/:hotelId", async (req, res) => {
    try {
      const { hotelId } = req.params;
      const config = await storage.getPmsConfiguration(hotelId);

      if (!config) {
        return res.status(404).json({ error: "PMS configuration not found" });
      }

      res.json(config);
    } catch (error) {
      console.error("Get PMS config error:", error);
      res.status(500).json({ error: "Failed to get PMS configuration" });
    }
  });

  app.post("/api/pms-config", async (req, res) => {
    try {
      const configData = insertPmsConfigurationSchema.parse(req.body);
      const config = await storage.createPmsConfiguration(configData);
      res.json(config);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Create PMS config error:", error);
      res.status(500).json({ error: "Failed to create PMS configuration" });
    }
  });

  // Get supported PMS types
  app.get("/api/pms/types", async (req, res) => {
    try {
      const types = PmsFactory.getSupportedPmsTypes();
      res.json(types);
    } catch (error) {
      console.error("Get PMS types error:", error);
      res.status(500).json({ error: "Failed to get PMS types" });
    }
  });

  // Arrivals Management - Get today's arrivals for a hotel
  app.get("/api/arrivals/:hotelId", async (req, res) => {
    try {
      const { hotelId } = req.params;
      // Default to today if no date provided
      const date = req.query.date 
        ? req.query.date as string
        : new Date().toISOString().split('T')[0];
      
      const arrivals = await storage.getArrivalsByHotel(hotelId, date);
      res.json(arrivals);
    } catch (error) {
      console.error("Get arrivals error:", error);
      res.status(500).json({ error: "Failed to get arrivals" });
    }
  });

  // Delete an arrival
  app.delete("/api/arrivals/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteArrival(id);
      res.json({ success: true, message: "Arrival deleted successfully" });
    } catch (error) {
      console.error("Delete arrival error:", error);
      res.status(500).json({ error: "Failed to delete arrival" });
    }
  });

  // Update an arrival (room number and number of nights)
  app.put("/api/arrivals/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { roomNumber, numberOfNights, checkInDate } = req.body;
      
      const updates: any = {};
      
      if (roomNumber !== undefined) {
        updates.roomNumber = roomNumber;
      }
      
      if (numberOfNights !== undefined && checkInDate) {
        updates.numberOfNights = numberOfNights;
        // Calculate new checkout date
        const checkIn = new Date(checkInDate);
        const checkOut = new Date(checkIn);
        checkOut.setDate(checkOut.getDate() + numberOfNights);
        updates.checkOutDate = checkOut.toISOString().split('T')[0];
      }
      
      const updatedArrival = await storage.updateArrival(id, updates);
      res.json(updatedArrival);
    } catch (error) {
      console.error("Update arrival error:", error);
      res.status(500).json({ error: "Failed to update arrival" });
    }
  });

  // Device Management - Register/Get Devices (Tablets)
  app.post("/api/devices", async (req, res) => {
    try {
      const deviceData = insertDeviceSchema.parse(req.body);
      const device = await storage.createDevice(deviceData);
      res.json(device);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Create device error:", error);
      res.status(500).json({ error: "Failed to create device" });
    }
  });

  app.get("/api/devices/:hotelId", async (req, res) => {
    try {
      const { hotelId } = req.params;
      const devices = await storage.getDevicesByHotel(hotelId);
      res.json(devices);
    } catch (error) {
      console.error("Get devices error:", error);
      res.status(500).json({ error: "Failed to get devices" });
    }
  });

  app.patch("/api/devices/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const device = await storage.updateDevice(id, updates);
      
      if (!device) {
        return res.status(404).json({ error: "Device not found" });
      }
      
      res.json(device);
    } catch (error) {
      console.error("Update device error:", error);
      res.status(500).json({ error: "Failed to update device" });
    }
  });

  app.delete("/api/devices/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteDevice(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete device error:", error);
      res.status(500).json({ error: "Failed to delete device" });
    }
  });

  // Contract Assignments - Send contracts to tablets
  app.post("/api/contract-assignments", async (req, res) => {
    try {
      const assignmentData = insertContractAssignmentSchema.parse(req.body);
      const assignment = await storage.createContractAssignment(assignmentData);
      res.json(assignment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Create contract assignment error:", error);
      res.status(500).json({ error: "Failed to create contract assignment" });
    }
  });

  app.get("/api/contract-assignments/:contractId", async (req, res) => {
    try {
      const { contractId } = req.params;
      const assignment = await storage.getContractAssignment(contractId);
      
      if (!assignment) {
        return res.status(404).json({ error: "Assignment not found" });
      }
      
      res.json(assignment);
    } catch (error) {
      console.error("Get contract assignment error:", error);
      res.status(500).json({ error: "Failed to get contract assignment" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
