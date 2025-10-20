import { Request, Response, NextFunction } from "express";
import type { IStorage } from "../storage";

/**
 * Admin middleware factory - requires storage to fetch user
 */
export function requireAdmin(storage: IStorage) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ 
        error: "Unauthorized", 
        message: "Please log in to access this resource" 
      });
    }

    try {
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(401).json({ 
          error: "Unauthorized", 
          message: "User not found" 
        });
      }

      if (user.role !== "admin") {
        return res.status(403).json({ 
          error: "Forbidden", 
          message: "Admin access required" 
        });
      }

      next();
    } catch (error) {
      console.error("Auth middleware error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
}

/**
 * Hotel staff middleware factory - ensures user has hotel access
 */
export function requireHotelStaff(storage: IStorage) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ 
        error: "Unauthorized", 
        message: "Please log in to access this resource" 
      });
    }

    try {
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(401).json({ 
          error: "Unauthorized", 
          message: "User not found" 
        });
      }

      // Allow both admin and hotel_staff roles
      if (user.role !== "hotel_staff" && user.role !== "admin") {
        return res.status(403).json({ 
          error: "Forbidden", 
          message: "Hotel staff access required" 
        });
      }

      // For hotel staff, ensure they have a hotelId
      if (user.role === "hotel_staff" && !user.hotelId) {
        return res.status(403).json({ 
          error: "Forbidden", 
          message: "No hotel associated with this account" 
        });
      }

      next();
    } catch (error) {
      console.error("Auth middleware error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
}
