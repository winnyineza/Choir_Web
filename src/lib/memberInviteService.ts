// Member Invitation Service
// Sends welcome emails to new choir members with portal access instructions

import { getSettings, type Member } from "./dataService";
import { dbGetAll, dbInsert, dbQuery, generateId } from './supabaseDB';

const INVITE_LOG_KEY = "choir_member_invites";

export interface MemberInviteLog {
  id: string;
  memberId: string;
  email: string;
  name: string;
  sentAt: string;
  status: "sent" | "failed" | "pending";
  error?: string;
}

/**
 * Get the portal URL based on environment
 */
function getPortalUrl(): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/member-portal`;
  }
  return "https://serenadesofpraise.netlify.app/member-portal";
}

/**
 * Generate the welcome email HTML
 */
function generateWelcomeEmailHtml(member: Partial<Member>, portalPin: string, portalUrl: string): string {
  const firstName = member.name?.split(" ")[0] || "Member";
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Serenades of Praise</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1a1a1a; border-radius: 16px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #d4a537 0%, #b8860b 100%); padding: 30px; text-align: center;">
              <img src="https://serenadesofpraise.netlify.app/LogoTSC.jpg" alt="Serenades of Praise" style="width: 64px; height: 64px; border-radius: 50%; object-fit: cover; border: 3px solid rgba(0,0,0,0.2); margin-bottom: 12px;" />
              <h1 style="margin: 0; color: #000; font-size: 24px; font-weight: bold;">Serenades of Praise</h1>
              <p style="margin: 10px 0 0; color: #000; font-size: 14px;">Member Portal Invitation</p>
            </td>
          </tr>
          
          <!-- Welcome Message -->
          <tr>
            <td style="padding: 30px; text-align: center;">
              <h2 style="margin: 0 0 10px; color: #fff; font-size: 22px;">Welcome, ${firstName}!</h2>
              <p style="margin: 0; color: #aaa; font-size: 15px; line-height: 1.6;">
                You've been added to the Serenades of Praise Choir. 
                You now have access to the Member Portal where you can view your 
                attendance, contributions, and more.
              </p>
            </td>
          </tr>
          
          <!-- Portal Access -->
          <tr>
            <td style="padding: 0 30px 30px;">
              <div style="background-color: #252525; border-radius: 12px; padding: 24px; border-left: 4px solid #d4a537;">
                <h3 style="margin: 0 0 20px; color: #d4a537; font-size: 18px;">How to Access the Portal</h3>
                
                <div style="margin-bottom: 16px;">
                  <p style="margin: 0 0 4px; color: #888; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Step 1 - Open Portal</p>
                  <p style="margin: 0; color: #fff; font-size: 15px;">Click the button below or visit the portal link</p>
                </div>
                
                <div style="margin-bottom: 16px;">
                  <p style="margin: 0 0 4px; color: #888; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Step 2 - Enter Portal PIN</p>
                  <div style="background: #1a1a1a; border-radius: 8px; padding: 12px 16px; display: inline-block; margin-top: 4px;">
                    <span style="font-family: monospace; font-size: 28px; color: #d4a537; letter-spacing: 12px; font-weight: bold;">${portalPin}</span>
                  </div>
                </div>
                
                <div>
                  <p style="margin: 0 0 4px; color: #888; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Step 3 - Enter Your Email</p>
                  <p style="margin: 0; color: #fff; font-size: 15px;">Use this email: <strong style="color: #d4a537;">${member.email}</strong></p>
                </div>
              </div>
            </td>
          </tr>
          
          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 30px 30px; text-align: center;">
              <a href="${portalUrl}" style="display: inline-block; background: linear-gradient(135deg, #d4a537 0%, #b8860b 100%); color: #000; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
                Open Member Portal
              </a>
            </td>
          </tr>

          <!-- Member Info -->
          <tr>
            <td style="padding: 0 30px 30px;">
              <div style="background-color: #252525; border-radius: 12px; padding: 20px;">
                <h4 style="margin: 0 0 15px; color: #fff; font-size: 16px;">Your Details</h4>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 6px 0; color: #888; font-size: 14px;">Name</td>
                    <td style="padding: 6px 0; color: #fff; font-size: 14px; text-align: right;">${member.name}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #888; font-size: 14px;">Email</td>
                    <td style="padding: 6px 0; color: #fff; font-size: 14px; text-align: right;">${member.email}</td>
                  </tr>
                  ${member.voice ? `
                  <tr>
                    <td style="padding: 6px 0; color: #888; font-size: 14px;">Voice Part</td>
                    <td style="padding: 6px 0; color: #d4a537; font-size: 14px; text-align: right; font-weight: bold;">${member.voice}</td>
                  </tr>
                  ` : ""}
                  ${member.phone ? `
                  <tr>
                    <td style="padding: 6px 0; color: #888; font-size: 14px;">Phone</td>
                    <td style="padding: 6px 0; color: #fff; font-size: 14px; text-align: right;">${member.phone}</td>
                  </tr>
                  ` : ""}
                </table>
              </div>
            </td>
          </tr>

          <!-- What You Can Do -->
          <tr>
            <td style="padding: 0 30px 30px;">
              <div style="background-color: #d4a53715; border-radius: 12px; padding: 20px; border: 1px solid #d4a53730;">
                <h4 style="margin: 0 0 10px; color: #d4a537; font-size: 14px;">What You Can Do in the Portal</h4>
                <ul style="margin: 0; padding-left: 20px; color: #ccc; font-size: 13px; line-height: 2;">
                  <li>View your attendance records</li>
                  <li>Track your contributions</li>
                  <li>Submit leave requests</li>
                  <li>Respond to surveys</li>
                  <li>Update your profile</li>
                </ul>
              </div>
            </td>
          </tr>
          
          <!-- Security Notice -->
          <tr>
            <td style="padding: 0 20px 20px;">
              <p style="margin: 0; color: #666; font-size: 12px; text-align: center; line-height: 1.6;">
                Keep your Portal PIN private. Do not share it with non-members.<br>
                If you did not expect this email, please ignore it.
              </p>
            </td>
          </tr>
          
          <!-- Signature -->
          <tr>
            <td style="padding: 20px 30px 10px; text-align: center;">
              <p style="margin: 0 0 4px; color: #ccc; font-size: 14px; font-style: italic;">Yours faithfully,</p>
              <p style="margin: 0; color: #d4a537; font-size: 15px; font-weight: 600;">Serenades of Praise Committee</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 16px 30px; background-color: #151515; text-align: center;">
              <p style="margin: 0 0 10px; color: #888; font-size: 12px;">
                Questions? Contact us at <a href="mailto:info@serenadesofpraise.com" style="color: #d4a537;">info@serenadesofpraise.com</a>
              </p>
              <p style="margin: 0; color: #666; font-size: 11px;">
                Serenades of Praise Choir &bull; Kacyiru SDA Church, Kigali, Rwanda
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Log an invite attempt to Supabase
 */
async function logInvite(entry: MemberInviteLog): Promise<void> {
  await dbInsert<MemberInviteLog>(INVITE_LOG_KEY, { ...entry, id: entry.id || generateId() });
}

/**
 * Get invite history for a member
 */
export async function getInviteHistory(memberId: string): Promise<MemberInviteLog[]> {
  return dbQuery<MemberInviteLog>(INVITE_LOG_KEY, 'member_id', memberId);
}

/**
 * Get all invite logs
 */
export async function getAllInviteLogs(): Promise<MemberInviteLog[]> {
  return dbGetAll<MemberInviteLog>(INVITE_LOG_KEY);
}

/**
 * Send welcome/invite email to a member
 */
export async function sendMemberInvite(member: Partial<Member> & { id: string; email: string; name: string }): Promise<{ success: boolean; message: string }> {
  const settings = await getSettings();
  const portalPin = settings.memberPortalPin || "2024";
  const portalUrl = getPortalUrl();
  
  const inviteLog: MemberInviteLog = {
    id: `invite_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    memberId: member.id,
    email: member.email,
    name: member.name,
    sentAt: new Date().toISOString(),
    status: "pending",
  };

  // Check if we're in development (no Netlify functions)
  const isDev = typeof window !== 'undefined' && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
  
  if (isDev) {
    // In development, log the email content instead of sending
    generateWelcomeEmailHtml(member, portalPin, portalUrl);
    console.info(
      `[DEV] Member invite email for ${member.name} (${member.email}):\n` +
      `Portal URL: ${portalUrl}\n` +
      `Portal PIN: ${portalPin}\n` +
      `(Email HTML generated but not sent in development mode)`
    );
    
    inviteLog.status = "sent";
    await logInvite(inviteLog);
    
    return {
      success: true,
      message: `Development mode: Invite logged for ${member.name}. In production, an email will be sent to ${member.email}.`,
    };
  }

  // Production: send via Netlify function
  try {
    const emailHtml = generateWelcomeEmailHtml(member, portalPin, portalUrl);
    
    const response = await fetch("/.netlify/functions/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: [{ email: member.email, name: member.name }],
        subject: "Welcome to Serenades of Praise - Member Portal Access",
        html: emailHtml,
      }),
    });

    if (response.ok) {
      inviteLog.status = "sent";
      await logInvite(inviteLog);
      return {
        success: true,
        message: `Welcome email sent to ${member.email}`,
      };
    } else {
      const error = await response.json().catch(() => ({ error: "Unknown error" }));
      inviteLog.status = "failed";
      inviteLog.error = error.error || "Failed to send";
      await logInvite(inviteLog);
      return {
        success: false,
        message: `Failed to send email: ${error.error || "Unknown error"}`,
      };
    }
  } catch (err: any) {
    inviteLog.status = "failed";
    inviteLog.error = err.message;
    await logInvite(inviteLog);
    return {
      success: false,
      message: `Error sending email: ${err.message}`,
    };
  }
}

/**
 * Send invites to multiple members at once
 */
export async function sendBulkInvites(members: Array<Partial<Member> & { id: string; email: string; name: string }>): Promise<{
  total: number;
  sent: number;
  failed: number;
  results: Array<{ email: string; success: boolean; message: string }>;
}> {
  const results: Array<{ email: string; success: boolean; message: string }> = [];
  let sent = 0;
  let failed = 0;

  for (const member of members) {
    // Small delay between sends to avoid rate limiting
    if (results.length > 0) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    const result = await sendMemberInvite(member);
    results.push({ email: member.email, ...result });
    
    if (result.success) sent++;
    else failed++;
  }

  return { total: members.length, sent, failed, results };
}

/**
 * Send admin invite email with invite code and login link
 */
export async function sendAdminInviteEmail(
  email: string,
  name: string,
  role: string,
  inviteCode: string
): Promise<{ success: boolean; message: string }> {
  const loginUrl = typeof window !== "undefined"
    ? `${window.location.origin}/admin?invite=${inviteCode}`
    : `https://serenadesofpraise.netlify.app/admin?invite=${inviteCode}`;

  const firstName = name.split(" ")[0] || "Admin";

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1a1a1a; border-radius: 16px; overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #d4a537 0%, #b8860b 100%); padding: 30px; text-align: center;">
              <img src="https://serenadesofpraise.netlify.app/LogoTSC.jpg" alt="Serenades of Praise" style="width: 64px; height: 64px; border-radius: 50%; object-fit: cover; border: 3px solid rgba(0,0,0,0.2); margin-bottom: 12px;" />
              <h1 style="margin: 0; color: #000; font-size: 24px; font-weight: bold;">Serenades of Praise</h1>
              <p style="margin: 10px 0 0; color: #000; font-size: 14px;">Admin Team Invitation</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px; text-align: center;">
              <h2 style="margin: 0 0 10px; color: #fff; font-size: 22px;">Welcome, ${firstName}!</h2>
              <p style="margin: 0; color: #aaa; font-size: 15px; line-height: 1.6;">
                You've been invited to join the <strong style="color: #d4a537;">Serenades of Praise</strong> admin team as <strong style="color: #d4a537;">${role}</strong>.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 30px 20px;">
              <div style="background-color: #252525; border-radius: 12px; padding: 20px; text-align: center;">
                <p style="margin: 0 0 8px; color: #aaa; font-size: 13px;">Your Invite Code</p>
                <p style="margin: 0; color: #d4a537; font-size: 28px; font-weight: bold; letter-spacing: 3px;">${inviteCode}</p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 30px 20px; text-align: center;">
              <p style="color: #aaa; font-size: 14px; line-height: 1.5;">To get started:</p>
              <ol style="color: #ccc; font-size: 14px; line-height: 1.8; text-align: left; padding-left: 20px;">
                <li>Click the button below to open the admin login page</li>
                <li>Click <strong style="color: #d4a537;">"Have an invite code?"</strong></li>
                <li>Enter your invite code</li>
                <li>Create your password</li>
              </ol>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 30px 30px; text-align: center;">
              <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #d4a537, #b8860b); color: #000; font-weight: bold; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-size: 16px;">
                Open Admin Login
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 30px 10px; text-align: center;">
              <p style="margin: 0 0 4px; color: #ccc; font-size: 14px; font-style: italic;">Yours faithfully,</p>
              <p style="margin: 0; color: #d4a537; font-size: 15px; font-weight: 600;">Serenades of Praise Committee</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 30px; border-top: 1px solid #333; text-align: center;">
              <p style="margin: 0; color: #666; font-size: 12px;">
                This invite code is for one-time use only. If you did not expect this invitation, please ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const isDev = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

  if (isDev) {
    console.info(
      `[DEV] Admin invite email for ${name} (${email}):\n` +
      `Login URL: ${loginUrl}\n` +
      `Invite Code: ${inviteCode}\n` +
      `Role: ${role}\n` +
      `(Email not sent in development mode)`
    );
    return { success: true, message: `Development mode: Invite logged for ${name}.` };
  }

  try {
    const response = await fetch("/.netlify/functions/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: [{ email, name }],
        subject: "You're Invited to Serenades of Praise Admin Team",
        html: emailHtml,
      }),
    });

    if (response.ok) {
      return { success: true, message: `Admin invite email sent to ${email}` };
    } else {
      const error = await response.json().catch(() => ({ error: "Unknown error" }));
      return { success: false, message: `Failed to send email: ${error.error || "Unknown error"}` };
    }
  } catch (err: any) {
    return { success: false, message: `Error sending email: ${err.message}` };
  }
}
