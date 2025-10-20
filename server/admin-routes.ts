import { Express, Request, Response } from "express";
import { z } from "zod";
import { IStorage } from "./storage";
import { requireAdmin } from "./middleware/admin";
import { insertHotelSchema, insertUserSchema } from "@shared/schema";
import { hashPassword } from "./auth";

export function registerAdminRoutes(app: Express, storage: IStorage) {
  const adminMiddleware = requireAdmin(storage);

  /**
   * GET /api/admin/hotels
   * Get all hotels (admin only)
   */
  app.get("/api/admin/hotels", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const hotels = await storage.getAllHotels();
      res.json(hotels);
    } catch (error) {
      console.error("Error fetching hotels:", error);
      res.status(500).json({ error: "Failed to fetch hotels" });
    }
  });

  /**
   * POST /api/admin/hotels
   * Create a new hotel (admin only)
   */
  app.post("/api/admin/hotels", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const hotelData = insertHotelSchema.parse(req.body);
      const hotel = await storage.createHotel(hotelData);
      res.json(hotel);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid hotel data", details: error.errors });
      }
      console.error("Error creating hotel:", error);
      res.status(500).json({ error: "Failed to create hotel" });
    }
  });

  /**
   * PUT /api/admin/hotels/:id
   * Update a hotel (admin only)
   */
  app.put("/api/admin/hotels/:id", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = insertHotelSchema.partial().parse(req.body);
      const hotel = await storage.updateHotel(id, updates);
      
      if (!hotel) {
        return res.status(404).json({ error: "Hotel not found" });
      }
      
      res.json(hotel);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid hotel data", details: error.errors });
      }
      console.error("Error updating hotel:", error);
      res.status(500).json({ error: "Failed to update hotel" });
    }
  });

  /**
   * DELETE /api/admin/hotels/:id
   * Delete a hotel (admin only)
   */
  app.delete("/api/admin/hotels/:id", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await storage.deleteHotel(id);
      res.json({ success: true, message: "Hotel deleted successfully" });
    } catch (error) {
      console.error("Error deleting hotel:", error);
      res.status(500).json({ error: "Failed to delete hotel" });
    }
  });

  /**
   * GET /api/admin/users
   * Get all users (admin only)
   */
  app.get("/api/admin/users", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      
      // Remove password hashes before sending to client
      const sanitizedUsers = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.json(sanitizedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  /**
   * POST /api/admin/users
   * Create a new user (admin only)
   */
  app.post("/api/admin/users", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ error: "User with this email already exists" });
      }
      
      // Hash password before creating user
      const hashedPassword = await hashPassword(userData.password);
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });
      
      // Remove password hash before sending to client
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid user data", details: error.errors });
      }
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  /**
   * PUT /api/admin/users/:id
   * Update a user (admin only)
   */
  app.put("/api/admin/users/:id", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = insertUserSchema.partial().parse(req.body);
      
      // If password is being updated, hash it
      if (updates.password) {
        updates.password = await hashPassword(updates.password);
      }
      
      const user = await storage.updateUser(id, updates);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Remove password hash before sending to client
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid user data", details: error.errors });
      }
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  /**
   * DELETE /api/admin/users/:id
   * Delete a user (admin only)
   */
  app.delete("/api/admin/users/:id", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // Prevent admin from deleting themselves
      const userId = req.session?.userId;
      if (userId === id) {
        return res.status(400).json({ error: "Cannot delete your own account" });
      }
      
      await storage.deleteUser(id);
      res.json({ success: true, message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });
}
