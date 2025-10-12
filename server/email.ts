/**
 * Email Service for Arrivo Hotel Check-in System
 * 
 * This is a placeholder implementation that logs emails to console.
 * In production, replace with a real email service like SendGrid, AWS SES, or Mailgun.
 */

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send an email (currently logs to console)
 * TODO: Integrate with real email service (SendGrid, AWS SES, etc.)
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  console.log('\n📧 EMAIL SENT:');
  console.log('To:', options.to);
  console.log('Subject:', options.subject);
  console.log('---');
  console.log(options.text || options.html);
  console.log('---\n');
  
  // In production, replace with actual email sending:
  // await emailProvider.send(options);
}

/**
 * Send OTP code email
 */
export async function sendOtpEmail(email: string, code: string, hotelName: string, type: 'login' | 'password_reset' | 'two_factor'): Promise<void> {
  const subjects = {
    login: `${code} is your Arrivo login code`,
    password_reset: `${code} is your password reset code`,
    two_factor: `${code} is your two-factor authentication code`,
  };
  
  const messages = {
    login: `Your login verification code is: ${code}\n\nThis code will expire in 15 minutes.\n\nIf you didn't request this code, please ignore this email.`,
    password_reset: `Your password reset code is: ${code}\n\nThis code will expire in 15 minutes.\n\nIf you didn't request a password reset, please contact support immediately.`,
    two_factor: `Your two-factor authentication code is: ${code}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this code, please secure your account immediately.`,
  };
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a1a1a;">Arrivo - ${hotelName}</h2>
      <p style="font-size: 16px; color: #333;">Your verification code is:</p>
      <div style="background: #f5f5f5; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1a1a1a;">${code}</span>
      </div>
      <p style="color: #666;">This code will expire in ${type === 'two_factor' ? '10' : '15'} minutes.</p>
      <p style="color: #999; font-size: 14px; margin-top: 30px;">If you didn't request this code, please ignore this email.</p>
    </div>
  `;
  
  await sendEmail({
    to: email,
    subject: subjects[type],
    html,
    text: messages[type],
  });
}

/**
 * Send login notification email
 */
export async function sendLoginNotification(
  email: string,
  hotelName: string,
  loginInfo: {
    date: string;
    time: string;
    deviceType: string;
    browser: string;
    ipAddress: string;
  }
): Promise<void> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a1a1a;">Arrivo - New Login Detected</h2>
      <p style="font-size: 16px; color: #333;">Hello ${hotelName},</p>
      <p style="color: #333;">A new login to your account was detected:</p>
      
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 8px 0;"><strong>Date:</strong> ${loginInfo.date}</p>
        <p style="margin: 8px 0;"><strong>Time:</strong> ${loginInfo.time}</p>
        <p style="margin: 8px 0;"><strong>Device:</strong> ${loginInfo.deviceType}</p>
        <p style="margin: 8px 0;"><strong>Browser:</strong> ${loginInfo.browser}</p>
        <p style="margin: 8px 0;"><strong>IP Address:</strong> ${loginInfo.ipAddress}</p>
      </div>
      
      <p style="color: #d32f2f; font-weight: bold;">If this wasn't you, please reset your password immediately.</p>
      
      <a href="https://arrivo.app/forgot-password" style="display: inline-block; background: #d32f2f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">
        This wasn't me
      </a>
      
      <p style="color: #999; font-size: 14px; margin-top: 30px;">This is an automated security notification from Arrivo.</p>
    </div>
  `;
  
  const text = `
Arrivo - New Login Detected

Hello ${hotelName},

A new login to your account was detected:

Date: ${loginInfo.date}
Time: ${loginInfo.time}
Device: ${loginInfo.deviceType}
Browser: ${loginInfo.browser}
IP Address: ${loginInfo.ipAddress}

If this wasn't you, please reset your password immediately by visiting:
https://arrivo.app/forgot-password

This is an automated security notification from Arrivo.
  `;
  
  await sendEmail({
    to: email,
    subject: 'Arrivo - New Login to Your Account',
    html,
    text,
  });
}

/**
 * Send password reset confirmation email
 */
export async function sendPasswordResetConfirmation(email: string, hotelName: string): Promise<void> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a1a1a;">Arrivo - Password Reset Successful</h2>
      <p style="font-size: 16px; color: #333;">Hello ${hotelName},</p>
      <p style="color: #333;">Your password has been successfully reset.</p>
      <p style="color: #666;">You can now log in to Arrivo with your new password.</p>
      <p style="color: #999; font-size: 14px; margin-top: 30px;">If you didn't request this change, please contact support immediately.</p>
    </div>
  `;
  
  await sendEmail({
    to: email,
    subject: 'Arrivo - Password Reset Successful',
    html,
    text: `Your password has been successfully reset. You can now log in to Arrivo with your new password.`,
  });
}
