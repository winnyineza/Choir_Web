// Email Verification Service
// Uses the Netlify send-email function (Gmail SMTP) in production
// Logs to console in development

import { generateVerificationCode, storeVerificationCode, verifyCode } from './leaveService';

export interface SendCodeResult {
  success: boolean;
  message: string;
  code?: string; // Only returned in development mode for testing
}

export interface VerifyCodeResult {
  success: boolean;
  message: string;
}

function isDev(): boolean {
  return typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
}

export async function sendVerificationCode(email: string, memberName: string, leaveId: string): Promise<SendCodeResult> {
  const code = generateVerificationCode();

  // Store the code
  await storeVerificationCode(email, code, leaveId);

  if (isDev()) {
    // In development, log the code to console
    console.info(`[DEV] Verification code for ${email}: ${code}`);
    return {
      success: true,
      message: `Verification code sent to ${email}. Check your email inbox.`,
      code, // Return code for development testing
    };
  }

  // Production: Send via Netlify send-email function (Gmail SMTP)
  try {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 15000);

    const response = await fetch('/.netlify/functions/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        to: [{ email, name: memberName }],
        subject: `Your Verification Code - Serenades of Praise`,
        html: generateEmailTemplate(memberName, code),
      }),
    });

    window.clearTimeout(timeoutId);

    if (response.ok) {
      return {
        success: true,
        message: `Verification code sent to ${email}. Please check your inbox.`,
      };
    } else {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Failed to send verification email:', errorData);
      return {
        success: false,
        message: 'Failed to send verification code. Please try again.',
      };
    }
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      return {
        success: false,
        message: 'Email request timed out. Please try again.',
      };
    }
    console.error('Failed to send verification email:', error);
    return {
      success: false,
      message: 'Failed to send verification code. Please try again.',
    };
  }
}

export async function verifyEmailCode(email: string, code: string): Promise<VerifyCodeResult> {
  const isValid = await verifyCode(email, code);

  if (isValid) {
    return {
      success: true,
      message: 'Code verified successfully!',
    };
  }

  return {
    success: false,
    message: 'Invalid or expired code. Please try again.',
  };
}

// Email template
export function generateEmailTemplate(memberName: string, code: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verification Code</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f7fb; color: #172033; padding: 40px 20px;">
      <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; padding: 40px; border: 1px solid rgba(212, 175, 55, 0.2); box-shadow: 0 20px 48px rgba(15, 23, 42, 0.08);">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="https://serenadesofpraise.netlify.app/LogoTSC.jpg" alt="Serenades of Praise" style="width: 64px; height: 64px; border-radius: 50%; object-fit: cover; border: 3px solid rgba(212, 175, 55, 0.35); margin-bottom: 12px;" />
          <h1 style="color: #d4af37; font-size: 24px; margin: 0;">Serenades of Praise</h1>
        </div>

        <p style="color: #475467; margin-bottom: 20px;">Hello ${memberName},</p>

        <p style="color: #172033; margin-bottom: 30px;">Your verification code is:</p>

        <div style="background-color: #f8fafc; border: 1px solid #e4e7ec; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 30px;">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #d4af37;">${code}</span>
        </div>

        <p style="color: #475467; font-size: 14px; margin-bottom: 20px;">
          This code expires in <strong>10 minutes</strong>.
        </p>

        <p style="color: #667085; font-size: 12px;">
          If you didn't request this code, please ignore this email.
        </p>

        <hr style="border: none; border-top: 1px solid rgba(212, 175, 55, 0.2); margin: 30px 0;">

        <p style="color: #667085; font-size: 12px; text-align: center;">
          Serenades of Praise Choir | Kacyiru SDA Church, Kigali
        </p>
      </div>
    </body>
    </html>
  `;
}
