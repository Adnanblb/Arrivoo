import { Express, Request, Response } from "express";
import { z } from "zod";
import { IStorage } from "./storage";
import { hashPassword, verifyPassword, generateOtpCode, getOtpExpiry, getDeviceInfo, getClientIP } from "./auth";
import { sendOtpEmail, sendLoginNotification, sendPasswordResetConfirmation } from "./email";
import {
  loginSchema,
  verifyOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  toggle2FASchema,
} from "@shared/schema";
import crypto from "crypto";

export function registerAuthRoutes(app: Express, storage: IStorage) {
  
  /**
   * POST /api/auth/login
   * Login with email and password
   */
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      
      // Verify password
      const isValidPassword = await verifyPassword(password, user.password);
      if (!isValidPassword) {
        // Log failed login attempt
        const deviceInfo = getDeviceInfo(req.headers);
        const ipAddress = getClientIP(req.headers, req.socket);
        
        await storage.createLoginHistory({
          userId: user.id,
          ipAddress,
          deviceType: deviceInfo.deviceType,
          browser: deviceInfo.browser,
          os: deviceInfo.os,
          status: "failed",
          sessionId: null,
        });
        
        return res.status(401).json({ error: "Invalid email or password" });
      }
      
      // Generate OTP code
      const otpCode = generateOtpCode();
      const expiresAt = getOtpExpiry('login');
      
      // Store OTP
      await storage.createOtpCode({
        userId: user.id,
        code: otpCode,
        type: 'login',
        expiresAt,
      });
      
      // Send OTP via email
      await sendOtpEmail(user.email, otpCode, user.hotelName, 'login');
      
      res.json({
        success: true,
        message: "OTP sent to your email",
        userId: user.id,
        email: user.email,
        requiresOtp: true,
        requires2FA: user.twoFactorEnabled,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Login error:", error);
      res.status(500).json({ error: "Failed to login" });
    }
  });
  
  /**
   * POST /api/auth/verify-otp
   * Verify OTP code and complete login
   */
  app.post("/api/auth/verify-otp", async (req: Request, res: Response) => {
    try {
      const { userId, code, type } = verifyOtpSchema.parse(req.body);
      
      // Get user
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Validate OTP
      const validOtp = await storage.getValidOtp(userId, code, type);
      if (!validOtp) {
        return res.status(401).json({ error: "Invalid or expired OTP code" });
      }
      
      // Mark OTP as used
      await storage.markOtpAsUsed(validOtp.id);
      
      // If 2FA is enabled and this was a login OTP, require 2FA
      if (type === 'login' && user.twoFactorEnabled) {
        // Generate 2FA code
        const twoFactorCode = generateOtpCode();
        const twoFactorExpiry = getOtpExpiry('two_factor');
        
        await storage.createOtpCode({
          userId: user.id,
          code: twoFactorCode,
          type: 'two_factor',
          expiresAt: twoFactorExpiry,
        });
        
        // Send 2FA code
        await sendOtpEmail(user.email, twoFactorCode, user.hotelName, 'two_factor');
        
        return res.json({
          success: true,
          requires2FA: true,
          message: "2FA code sent to your email",
          userId: user.id,
        });
      }
      
      // Create session
      const sessionId = crypto.randomBytes(32).toString('hex');
      const deviceInfo = getDeviceInfo(req.headers);
      const ipAddress = getClientIP(req.headers, req.socket);
      
      // Log successful login
      await storage.createLoginHistory({
        userId: user.id,
        ipAddress,
        deviceType: deviceInfo.deviceType,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        status: "success",
        sessionId,
      });
      
      // Update last login
      await storage.updateUserLastLogin(user.id);
      
      // Send login notification email
      const now = new Date();
      await sendLoginNotification(user.email, user.hotelName, {
        date: now.toLocaleDateString(),
        time: now.toLocaleTimeString(),
        deviceType: deviceInfo.deviceType,
        browser: deviceInfo.browser,
        ipAddress,
      });
      
      // Store session in express session
      if (req.session) {
        req.session.userId = user.id;
        req.session.sessionId = sessionId;
      }
      
      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          hotelName: user.hotelName,
          hotelId: user.hotelId,
          logoUrl: user.logoUrl,
          role: user.role,
          twoFactorEnabled: user.twoFactorEnabled,
        },
        sessionId,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("OTP verification error:", error);
      res.status(500).json({ error: "Failed to verify OTP" });
    }
  });
  
  /**
   * POST /api/auth/resend-otp
   * Resend OTP code
   */
  app.post("/api/auth/resend-otp", async (req: Request, res: Response) => {
    try {
      const { userId, type } = req.body;
      
      if (!userId || !type) {
        return res.status(400).json({ error: "Missing userId or type" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Generate new OTP
      const otpCode = generateOtpCode();
      const expiresAt = getOtpExpiry(type);
      
      await storage.createOtpCode({
        userId: user.id,
        code: otpCode,
        type,
        expiresAt,
      });
      
      // Send OTP via email
      await sendOtpEmail(user.email, otpCode, user.hotelName, type);
      
      res.json({
        success: true,
        message: "New OTP sent to your email",
      });
    } catch (error) {
      console.error("Resend OTP error:", error);
      res.status(500).json({ error: "Failed to resend OTP" });
    }
  });
  
  /**
   * POST /api/auth/forgot-password
   * Request password reset
   */
  app.post("/api/auth/forgot-password", async (req: Request, res: Response) => {
    try {
      const { email } = forgotPasswordSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal if email exists or not for security
        return res.json({
          success: true,
          message: "If the email exists, a password reset code has been sent",
        });
      }
      
      // Generate password reset OTP
      const otpCode = generateOtpCode();
      const expiresAt = getOtpExpiry('password_reset');
      
      await storage.createOtpCode({
        userId: user.id,
        code: otpCode,
        type: 'password_reset',
        expiresAt,
      });
      
      // Send password reset OTP
      await sendOtpEmail(user.email, otpCode, user.hotelName, 'password_reset');
      
      res.json({
        success: true,
        message: "If the email exists, a password reset code has been sent",
        userId: user.id, // Include userId for next step
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Forgot password error:", error);
      res.status(500).json({ error: "Failed to process password reset request" });
    }
  });
  
  /**
   * POST /api/auth/reset-password
   * Reset password with OTP
   */
  app.post("/api/auth/reset-password", async (req: Request, res: Response) => {
    try {
      const { userId, code, newPassword } = resetPasswordSchema.parse(req.body);
      
      // Validate OTP
      const validOtp = await storage.getValidOtp(userId, code, 'password_reset');
      if (!validOtp) {
        return res.status(401).json({ error: "Invalid or expired reset code" });
      }
      
      // Get user
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Hash new password
      const hashedPassword = await hashPassword(newPassword);
      
      // Update password
      await storage.updateUser(userId, { password: hashedPassword });
      
      // Mark OTP as used
      await storage.markOtpAsUsed(validOtp.id);
      
      // Send confirmation email
      await sendPasswordResetConfirmation(user.email, user.hotelName);
      
      res.json({
        success: true,
        message: "Password reset successful",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Reset password error:", error);
      res.status(500).json({ error: "Failed to reset password" });
    }
  });
  
  /**
   * POST /api/auth/logout
   * Logout current session
   */
  app.post("/api/auth/logout", async (req: Request, res: Response) => {
    try {
      const sessionId = req.session?.sessionId;
      
      if (sessionId) {
        await storage.logoutSession(sessionId);
      }
      
      // Destroy session
      req.session?.destroy((err: Error | null) => {
        if (err) {
          console.error("Session destroy error:", err);
        }
      });
      
      res.json({ success: true, message: "Logged out successfully" });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ error: "Failed to logout" });
    }
  });
  
  /**
   * GET /api/auth/me
   * Get current authenticated user
   */
  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      const userId = req.session?.userId;
      
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json({
        id: user.id,
        email: user.email,
        hotelName: user.hotelName,
        hotelId: user.hotelId,
        logoUrl: user.logoUrl,
        role: user.role,
        twoFactorEnabled: user.twoFactorEnabled,
        lastLoginAt: user.lastLoginAt,
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to get user" });
    }
  });
  
  /**
   * GET /api/auth/login-history
   * Get login history for current user
   */
  app.get("/api/auth/login-history", async (req: Request, res: Response) => {
    try {
      const userId = req.session?.userId;
      
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const limit = parseInt(req.query.limit as string) || 5;
      const history = await storage.getLoginHistoryByUser(userId, limit);
      
      res.json(history);
    } catch (error) {
      console.error("Get login history error:", error);
      res.status(500).json({ error: "Failed to get login history" });
    }
  });
  
  /**
   * POST /api/auth/logout-session
   * Logout a specific session
   */
  app.post("/api/auth/logout-session", async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.body;
      
      if (!sessionId) {
        return res.status(400).json({ error: "Session ID required" });
      }
      
      await storage.logoutSession(sessionId);
      
      res.json({ success: true, message: "Session logged out successfully" });
    } catch (error) {
      console.error("Logout session error:", error);
      res.status(500).json({ error: "Failed to logout session" });
    }
  });
  
  /**
   * PUT /api/auth/toggle-2fa
   * Toggle two-factor authentication
   */
  app.put("/api/auth/toggle-2fa", async (req: Request, res: Response) => {
    try {
      const userId = req.session?.userId;
      
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const { enabled } = toggle2FASchema.parse(req.body);
      
      const user = await storage.toggleUser2FA(userId, enabled);
      
      res.json({
        success: true,
        twoFactorEnabled: user?.twoFactorEnabled,
        message: enabled ? "Two-factor authentication enabled" : "Two-factor authentication disabled",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Toggle 2FA error:", error);
      res.status(500).json({ error: "Failed to toggle 2FA" });
    }
  });
}
