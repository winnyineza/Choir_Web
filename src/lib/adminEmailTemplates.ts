const LOGO_URL = "https://serenadesofpraise.netlify.app/LogoTSC.jpg";

export function buildAdminPasswordResetEmailHtml(resetLink: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #d9e2ec; border-radius: 16px; padding: 30px; color: #172033;">
      <div style="text-align: center; margin-bottom: 12px;">
        <img src="${LOGO_URL}" alt="Serenades of Praise" style="width: 64px; height: 64px; border-radius: 50%; object-fit: cover; border: 3px solid rgba(212, 165, 55, 0.35); margin-bottom: 12px;" />
      </div>
      <h1 style="color: #d4a537;">Password Reset</h1>
      <p>You requested a password reset for your admin account.</p>
      <p>Click the button below to reset your password. This link expires in 1 hour.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #d4a537, #b8860b); color: #000; font-weight: bold; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-size: 16px;">Reset Password</a>
      </div>
      <p style="color: #667085; font-size: 12px;">If you didn't request this, you can safely ignore this email.</p>
      <p style="color: #98a2b3; font-size: 11px; margin-top: 20px;">Serenades of Praise Choir</p>
    </div>
  `;
}
