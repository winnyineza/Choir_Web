// Email Verification Service
// For production, integrate with Resend, SendGrid, or similar

import { generateVerificationCode, storeVerificationCode, verifyCode } from './leaveService';

// For development/demo: codes are shown in console and stored locally
// For production: integrate with Resend API
const IS_DEVELOPMENT = true; // Set to false when integrating real email service

export interface SendCodeResult {
  success: boolean;
  message: string;
  code?: string; // Only returned in development mode for testing
}

export interface VerifyCodeResult {
  success: boolean;
  message: string;
}

export async function sendVerificationCode(email: string, memberName: string): Promise<SendCodeResult> {
  const code = generateVerificationCode();
  
  // Store the code locally
  storeVerificationCode(email, code);
  
  if (IS_DEVELOPMENT) {
    // In development, log the code to console and return it
    console.log(`📧 Verification code for ${email}: ${code}`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      message: `Verification code sent to ${email}. Check your email inbox.`,
      code, // Return code for development testing
    };
  }
  
  // Production: Send via Resend API
  try {
    // TODO: Replace with actual Resend API call
    // const response = await fetch('https://api.resend.com/emails', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${RESEND_API_KEY}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     from: 'Serenades of Praise <noreply@serenadesofpraise.com>',
    //     to: email,
    //     subject: `Your Verification Code - ${code}`,
    //     html: generateEmailTemplate(memberName, code),
    //   }),
    // });
    
    // Simulate for now
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      success: true,
      message: `Verification code sent to ${email}. Please check your inbox.`,
    };
  } catch (error) {
    console.error('Failed to send verification email:', error);
    return {
      success: false,
      message: 'Failed to send verification code. Please try again.',
    };
  }
}

export function verifyEmailCode(email: string, code: string): VerifyCodeResult {
  const isValid = verifyCode(email, code);
  
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

// Email template for production use
function generateEmailTemplate(memberName: string, code: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verification Code</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0c0a09; color: #fafaf9; padding: 40px 20px;">
      <div style="max-width: 500px; margin: 0 auto; background-color: #1c1917; border-radius: 16px; padding: 40px; border: 1px solid rgba(212, 175, 55, 0.2);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #d4af37; font-size: 24px; margin: 0;">🎵 Serenades of Praise</h1>
        </div>
        
        <p style="color: #a8a29e; margin-bottom: 20px;">Hello ${memberName},</p>
        
        <p style="color: #fafaf9; margin-bottom: 30px;">Your verification code is:</p>
        
        <div style="background-color: #292524; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 30px;">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #d4af37;">${code}</span>
        </div>
        
        <p style="color: #a8a29e; font-size: 14px; margin-bottom: 20px;">
          This code expires in <strong>10 minutes</strong>.
        </p>
        
        <p style="color: #78716c; font-size: 12px;">
          If you didn't request this code, please ignore this email.
        </p>
        
        <hr style="border: none; border-top: 1px solid rgba(212, 175, 55, 0.2); margin: 30px 0;">
        
        <p style="color: #78716c; font-size: 12px; text-align: center;">
          Serenades of Praise Choir | Kacyiru SDA Church, Kigali
        </p>
      </div>
    </body>
    </html>
  `;
}

