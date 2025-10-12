import { Request, Response, NextFunction } from "express";
import type { IStorage } from "./storage";

/**
 * Authentication middleware to protect routes
 * Checks if user is authenticated via session
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId) {
    return res.status(401).json({ 
      error: "Unauthorized", 
      message: "Please log in to access this resource" 
    });
  }
  next();
}

/**
 * Optional authentication middleware
 * Adds user info to request if authenticated, but doesn't block access
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  // This middleware doesn't block, just passes through
  // It's useful for routes that can work with or without authentication
  next();
}

/**
 * Middleware to attach storage to request
 */
export function attachStorage(storage: IStorage) {
  return (req: Request, res: Response, next: NextFunction) => {
    (req as any).storage = storage;
    next();
  };
}
