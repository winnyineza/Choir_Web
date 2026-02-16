// Notification Email Service - Send email notifications for requests and approvals

import { getAllAdminUsers, canApproveLeave } from "./adminService";
import { getSettings } from "./dataService";
import { MONTH_NAMES } from "./contributionService";

const isDev = () => typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

async function sendEmail(to: Array<{ email: string; name: string }>, subject: string, html: string): Promise<boolean> {
  if (to.length === 0) return false;

  if (isDev()) {
    console.log(`[DEV] Email notification:`, { to: to.map(t => t.email), subject });
    return true;
  }

  try {
    const response = await fetch("/.netlify/functions/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, subject, html }),
    });
    return response.ok;
  } catch {
    console.error("Failed to send notification email");
    return false;
  }
}

function emailWrapper(title: string, body: string, choirName: string): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 32px; color: #e0e0e0;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #d4af37; margin: 0; font-size: 20px;">${choirName}</h2>
        </div>
        <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 24px; margin-bottom: 16px;">
          <h3 style="color: #ffffff; margin: 0 0 16px 0; font-size: 18px;">${title}</h3>
          ${body}
        </div>
        <p style="color: #888; font-size: 12px; text-align: center; margin: 16px 0 0 0;">
          This is an automated notification from ${choirName} Admin Portal.
        </p>
      </div>
    </div>
  `;
}

// ============ LEAVE REQUEST NOTIFICATIONS ============

export async function notifyLeaveRequestCreated(
  memberName: string,
  startDate: string,
  endDate: string,
  reason: string
): Promise<void> {
  const [admins, settings] = await Promise.all([getAllAdminUsers(), getSettings()]);
  const approvers = admins.filter(a => canApproveLeave(a) && a.isActive);
  if (approvers.length === 0) return;

  const to = approvers.map(a => ({ email: a.email, name: a.name }));
  const subject = `New Leave Request from ${memberName}`;
  const html = emailWrapper("New Leave Request", `
    <p style="color: #e0e0e0; margin: 0 0 12px 0;"><strong>${memberName}</strong> has submitted a leave request.</p>
    <table style="width: 100%; border-collapse: collapse;">
      <tr><td style="color: #888; padding: 4px 8px 4px 0; white-space: nowrap;">From:</td><td style="color: #fff; padding: 4px 0;">${new Date(startDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</td></tr>
      <tr><td style="color: #888; padding: 4px 8px 4px 0; white-space: nowrap;">To:</td><td style="color: #fff; padding: 4px 0;">${new Date(endDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</td></tr>
      <tr><td style="color: #888; padding: 4px 8px 4px 0; white-space: nowrap;">Reason:</td><td style="color: #fff; padding: 4px 0;">${reason}</td></tr>
    </table>
    <p style="color: #d4af37; margin: 16px 0 0 0; font-size: 14px;">Please log in to the admin portal to review and vote on this request.</p>
  `, settings.choirName);

  await sendEmail(to, subject, html);
}

export async function notifyLeaveRequestDecision(
  memberEmail: string,
  memberName: string,
  startDate: string,
  endDate: string,
  status: "approved" | "denied",
  reviewerName?: string
): Promise<void> {
  const settings = await getSettings();
  const statusColor = status === "approved" ? "#22c55e" : "#ef4444";
  const statusText = status === "approved" ? "Approved" : "Denied";

  const subject = `Leave Request ${statusText}`;
  const html = emailWrapper(`Leave Request ${statusText}`, `
    <p style="color: #e0e0e0; margin: 0 0 12px 0;">Hi <strong>${memberName}</strong>,</p>
    <p style="color: #e0e0e0; margin: 0 0 16px 0;">Your leave request has been <span style="color: ${statusColor}; font-weight: bold;">${statusText.toLowerCase()}</span>.</p>
    <table style="width: 100%; border-collapse: collapse;">
      <tr><td style="color: #888; padding: 4px 8px 4px 0; white-space: nowrap;">From:</td><td style="color: #fff; padding: 4px 0;">${new Date(startDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</td></tr>
      <tr><td style="color: #888; padding: 4px 8px 4px 0; white-space: nowrap;">To:</td><td style="color: #fff; padding: 4px 0;">${new Date(endDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</td></tr>
      <tr><td style="color: #888; padding: 4px 8px 4px 0; white-space: nowrap;">Status:</td><td style="color: ${statusColor}; padding: 4px 0; font-weight: bold;">${statusText}</td></tr>
    </table>
    ${status === "approved"
      ? `<p style="color: #22c55e; margin: 16px 0 0 0; font-size: 14px;">Your leave has been approved. You are excused from activities during this period.</p>`
      : `<p style="color: #ef4444; margin: 16px 0 0 0; font-size: 14px;">Unfortunately your leave request was not approved. Please contact the admin team for more details.</p>`
    }
  `, settings.choirName);

  await sendEmail([{ email: memberEmail, name: memberName }], subject, html);
}

// ============ UNLOCK REQUEST NOTIFICATIONS ============

export async function notifyUnlockRequestCreated(
  requestedBy: string,
  requestedByRole: string,
  month: number,
  year: number,
  type: string,
  reason: string
): Promise<void> {
  const [admins, settings] = await Promise.all([getAllAdminUsers(), getSettings()]);
  const approvers = admins.filter(a => (a.role === "super_admin" || a.role === "main_admin") && a.isActive);
  if (approvers.length === 0) return;

  const monthName = MONTH_NAMES[month - 1];
  const typeLabel = type === "both" ? "Contributions & Attendance" : type;
  const to = approvers.map(a => ({ email: a.email, name: a.name }));
  const subject = `Unlock Request: ${monthName} ${year}`;
  const html = emailWrapper("Month Unlock Request", `
    <p style="color: #e0e0e0; margin: 0 0 12px 0;"><strong>${requestedBy}</strong> (${requestedByRole}) has requested to unlock a locked month.</p>
    <table style="width: 100%; border-collapse: collapse;">
      <tr><td style="color: #888; padding: 4px 8px 4px 0; white-space: nowrap;">Month:</td><td style="color: #fff; padding: 4px 0;">${monthName} ${year}</td></tr>
      <tr><td style="color: #888; padding: 4px 8px 4px 0; white-space: nowrap;">Type:</td><td style="color: #fff; padding: 4px 0;">${typeLabel}</td></tr>
      <tr><td style="color: #888; padding: 4px 8px 4px 0; white-space: nowrap;">Reason:</td><td style="color: #fff; padding: 4px 0;">${reason}</td></tr>
    </table>
    <p style="color: #d4af37; margin: 16px 0 0 0; font-size: 14px;">Please log in to the admin portal Settings to approve or deny this request.</p>
  `, settings.choirName);

  await sendEmail(to, subject, html);
}

export async function notifyUnlockRequestDecision(
  requesterEmail: string,
  requesterName: string,
  month: number,
  year: number,
  status: "approved" | "denied",
  reviewerName: string,
  daysUnlocked?: number
): Promise<void> {
  const settings = await getSettings();
  const monthName = MONTH_NAMES[month - 1];
  const statusColor = status === "approved" ? "#22c55e" : "#ef4444";
  const statusText = status === "approved" ? "Approved" : "Denied";

  const subject = `Unlock Request ${statusText}: ${monthName} ${year}`;
  const html = emailWrapper(`Unlock Request ${statusText}`, `
    <p style="color: #e0e0e0; margin: 0 0 12px 0;">Hi <strong>${requesterName}</strong>,</p>
    <p style="color: #e0e0e0; margin: 0 0 16px 0;">Your unlock request for <strong>${monthName} ${year}</strong> has been <span style="color: ${statusColor}; font-weight: bold;">${statusText.toLowerCase()}</span> by ${reviewerName}.</p>
    ${status === "approved" && daysUnlocked
      ? `<p style="color: #22c55e; margin: 0 0 8px 0; font-size: 14px;">The month is now unlocked for <strong>${daysUnlocked} days</strong>. Please complete your data entry before it locks again.</p>`
      : status === "denied"
      ? `<p style="color: #ef4444; margin: 0 0 8px 0; font-size: 14px;">The request was denied. Please contact the admin team if you have questions.</p>`
      : ""
    }
  `, settings.choirName);

  await sendEmail([{ email: requesterEmail, name: requesterName }], subject, html);
}
