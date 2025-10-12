/**
 * Email Service for Arrivo Hotel Check-in System
 * Integrated with Resend for production email sending
 */

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send an email using Resend
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    // Use Resend's test email for development, or verified domain for production
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    const fromName = process.env.RESEND_FROM_NAME || 'Arrivo';
    
    // Check if the from email domain is verified
    // For unverified domains, fallback to Resend's test email
    let actualFromEmail = fromEmail;
    if (!fromEmail.endsWith('@resend.dev') && !fromEmail.includes('verified-domain')) {
      console.warn(`⚠️  Email domain ${fromEmail} may not be verified. Using onboarding@resend.dev for development.`);
      actualFromEmail = 'onboarding@resend.dev';
    }
    
    const { data, error } = await resend.emails.send({
      from: `${fromName} <${actualFromEmail}>`,
      to: [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    if (error) {
      console.error('❌ Email sending failed:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    console.log('✅ Email sent successfully:', {
      to: options.to,
      from: `${fromName} <${actualFromEmail}>`,
      subject: options.subject,
      messageId: data?.id,
    });
  } catch (error) {
    console.error('❌ Email error:', error);
    throw error;
  }
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
