import bcrypt from "bcrypt";
import crypto from "crypto";

const SALT_ROUNDS = 10;

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hashed password
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

/**
 * Generate a 6-digit OTP code
 */
export function generateOtpCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Generate a secure random token for email verification/password reset
 */
export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate OTP expiry time (15 minutes for login OTP, 10 minutes for 2FA)
 */
export function getOtpExpiry(type: 'login' | 'password_reset' | 'two_factor'): Date {
  const now = new Date();
  const minutes = type === 'login' || type === 'password_reset' ? 15 : 10;
  return new Date(now.getTime() + minutes * 60 * 1000);
}

/**
 * Extract device information from request headers
 */
export function getDeviceInfo(headers: Record<string, string | string[] | undefined>): {
  deviceType: string;
  browser: string;
  os: string;
} {
  const userAgent = (headers['user-agent'] as string) || '';
  
  // Simple device type detection
  let deviceType = 'Desktop';
  if (/mobile/i.test(userAgent)) {
    deviceType = 'Mobile';
  } else if (/tablet|ipad/i.test(userAgent)) {
    deviceType = 'Tablet';
  }
  
  // Simple browser detection
  let browser = 'Unknown';
  if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Safari')) browser = 'Safari';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Edge')) browser = 'Edge';
  
  // Simple OS detection
  let os = 'Unknown';
  if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Mac OS')) os = 'macOS';
  else if (userAgent.includes('Linux')) os = 'Linux';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('iOS')) os = 'iOS';
  
  return { deviceType, browser, os };
}

/**
 * Get client IP address from request
 */
export function getClientIP(headers: Record<string, string | string[] | undefined>, socket?: { remoteAddress?: string }): string {
  // Try various headers that might contain the real IP
  const xForwardedFor = headers['x-forwarded-for'];
  if (xForwardedFor) {
    const ips = Array.isArray(xForwardedFor) ? xForwardedFor[0] : xForwardedFor;
    return ips.split(',')[0].trim();
  }
  
  const xRealIp = headers['x-real-ip'];
  if (xRealIp) {
    return Array.isArray(xRealIp) ? xRealIp[0] : xRealIp;
  }
  
  return socket?.remoteAddress || 'Unknown';
}
