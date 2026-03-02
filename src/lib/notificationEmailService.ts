// Notification Email Service - Send email notifications for requests and approvals

import { getAllAdminUsers, canApproveLeave, canApproveMeetingMinutes } from "./adminService";
import { getSettings, getAllMembers } from "./dataService";
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

const LOGO_URL = "https://serenadesofpraise.netlify.app/LogoTSC.jpg";

function emailWrapper(title: string, body: string, choirName: string): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 32px; color: #e0e0e0;">
        <div style="text-align: center; margin-bottom: 24px;">
          <img src="${LOGO_URL}" alt="${choirName}" style="width: 72px; height: 72px; border-radius: 50%; object-fit: cover; border: 3px solid #d4af37; margin-bottom: 12px;" />
          <h2 style="color: #d4af37; margin: 0; font-size: 20px;">${choirName}</h2>
        </div>
        <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 24px; margin-bottom: 16px;">
          <h3 style="color: #ffffff; margin: 0 0 16px 0; font-size: 18px;">${title}</h3>
          ${body}
        </div>
        <div style="text-align: center; margin-top: 20px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.1);">
          <p style="color: #ccc; font-size: 14px; margin: 0 0 4px 0; font-style: italic;">Yours faithfully,</p>
          <p style="color: #d4af37; font-size: 15px; font-weight: 600; margin: 0 0 12px 0;">Serenades of Praise Committee</p>
          <p style="color: #666; font-size: 11px; margin: 0;">
            This is an automated notification from ${choirName} Admin Portal.
          </p>
        </div>
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

// ============ CONTRIBUTION RECEIPT NOTIFICATIONS ============

function formatCurrencyEmail(amount: number): string {
  return `${amount.toLocaleString()} RWF`;
}

export async function notifyContributionRecorded(
  memberEmail: string,
  memberName: string,
  amount: number,
  expectedAmount: number,
  month: number,
  year: number,
  category: "monthly" | "special",
  typeName?: string
): Promise<void> {
  const settings = await getSettings();
  const monthName = MONTH_NAMES[month - 1];
  const remaining = Math.max(0, expectedAmount - amount);
  const percentage = expectedAmount > 0 ? Math.round((amount / expectedAmount) * 100) : 100;
  const isFullyPaid = amount >= expectedAmount && expectedAmount > 0;

  const statusBadge = isFullyPaid
    ? `<span style="background: rgba(34,197,94,0.2); color: #22c55e; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: bold;">Fully Paid</span>`
    : `<span style="background: rgba(234,179,8,0.2); color: #eab308; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: bold;">${percentage}% Paid</span>`;

  const subject = isFullyPaid
    ? `Payment Confirmed: ${category === "monthly" ? `${monthName} ${year} Dues` : typeName || "Contribution"}`
    : `Payment Received: ${formatCurrencyEmail(amount)} for ${category === "monthly" ? `${monthName} ${year}` : typeName || "Contribution"}`;

  const html = emailWrapper("Contribution Receipt", `
    <p style="color: #e0e0e0; margin: 0 0 12px 0;">Hi <strong>${memberName}</strong>,</p>
    <p style="color: #e0e0e0; margin: 0 0 16px 0;">Your payment has been recorded. Here's your receipt:</p>
    <div style="text-align: center; margin-bottom: 16px;">${statusBadge}</div>
    <table style="width: 100%; border-collapse: collapse;">
      ${category === "monthly" ? `<tr><td style="color: #888; padding: 6px 8px 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">Month:</td><td style="color: #fff; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05); text-align: right;">${monthName} ${year}</td></tr>` : ""}
      ${typeName ? `<tr><td style="color: #888; padding: 6px 8px 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">Type:</td><td style="color: #fff; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05); text-align: right;">${typeName}</td></tr>` : ""}
      <tr><td style="color: #888; padding: 6px 8px 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">Amount Paid:</td><td style="color: #22c55e; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05); text-align: right; font-weight: bold; font-size: 16px;">${formatCurrencyEmail(amount)}</td></tr>
      ${expectedAmount > 0 ? `<tr><td style="color: #888; padding: 6px 8px 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">Expected:</td><td style="color: #fff; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05); text-align: right;">${formatCurrencyEmail(expectedAmount)}</td></tr>` : ""}
      ${!isFullyPaid && remaining > 0 ? `<tr><td style="color: #888; padding: 6px 8px 6px 0;">Remaining:</td><td style="color: #eab308; padding: 6px 0; text-align: right; font-weight: bold;">${formatCurrencyEmail(remaining)}</td></tr>` : ""}
    </table>
    ${isFullyPaid
      ? `<p style="color: #22c55e; margin: 16px 0 0 0; font-size: 14px; text-align: center;">Thank you for your full payment!</p>`
      : `<p style="color: #eab308; margin: 16px 0 0 0; font-size: 14px; text-align: center;">You still have <strong>${formatCurrencyEmail(remaining)}</strong> remaining. Thank you for your contribution!</p>`
    }
  `, settings.choirName);

  await sendEmail([{ email: memberEmail, name: memberName }], subject, html);
}

// ============ ANNOUNCEMENT NOTIFICATIONS ============

export async function notifyAnnouncementPosted(
  title: string,
  content: string,
  priority: string,
  audience: string
): Promise<void> {
  const [members, settings] = await Promise.all([getAllMembers(), getSettings()]);
  const activeMembers = members.filter(m => m.status === "Active" && m.email);
  if (activeMembers.length === 0) return;

  const priorityBadge = priority === "urgent"
    ? `<span style="background: rgba(239,68,68,0.2); color: #ef4444; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: bold;">URGENT</span>`
    : priority === "high"
    ? `<span style="background: rgba(234,179,8,0.2); color: #eab308; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: bold;">HIGH PRIORITY</span>`
    : "";

  const subject = `${priority === "urgent" ? "[URGENT] " : ""}${title}`;
  const html = emailWrapper("Announcement", `
    <div style="margin-bottom: 12px;">${priorityBadge}</div>
    <h3 style="color: #ffffff; margin: 0 0 12px 0;">${title}</h3>
    <div style="color: #d0d0d0; line-height: 1.6; white-space: pre-line;">${content}</div>
    <p style="color: #d4af37; margin: 16px 0 0 0; font-size: 13px;">Visit the member portal for more details.</p>
  `, settings.choirName);

  const to = activeMembers.map(m => ({ email: m.email, name: m.name }));
  await sendEmail(to, subject, html);
}

// ============ EVENT NOTIFICATIONS ============

export async function notifyEventCreated(
  eventTitle: string,
  eventDate: string,
  eventTime: string,
  eventLocation: string,
  description?: string,
  isFree?: boolean
): Promise<void> {
  const [members, settings] = await Promise.all([getAllMembers(), getSettings()]);
  const activeMembers = members.filter(m => m.status === "Active" && m.email);
  if (activeMembers.length === 0) return;

  const formattedDate = new Date(eventDate).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric"
  });

  const subject = `New Event: ${eventTitle}`;
  const html = emailWrapper("New Event", `
    <h3 style="color: #d4af37; margin: 0 0 16px 0;">${eventTitle}</h3>
    <table style="width: 100%; border-collapse: collapse;">
      <tr><td style="color: #888; padding: 6px 8px 6px 0; white-space: nowrap;">Date:</td><td style="color: #fff; padding: 6px 0;">${formattedDate}</td></tr>
      <tr><td style="color: #888; padding: 6px 8px 6px 0; white-space: nowrap;">Time:</td><td style="color: #fff; padding: 6px 0;">${eventTime}</td></tr>
      <tr><td style="color: #888; padding: 6px 8px 6px 0; white-space: nowrap;">Location:</td><td style="color: #fff; padding: 6px 0;">${eventLocation}</td></tr>
      ${isFree !== undefined ? `<tr><td style="color: #888; padding: 6px 8px 6px 0; white-space: nowrap;">Admission:</td><td style="color: ${isFree ? "#22c55e" : "#d4af37"}; padding: 6px 0;">${isFree ? "Free" : "Ticketed"}</td></tr>` : ""}
    </table>
    ${description ? `<p style="color: #d0d0d0; margin: 16px 0 0 0; line-height: 1.5;">${description.substring(0, 300)}${description.length > 300 ? "..." : ""}</p>` : ""}
    <p style="color: #d4af37; margin: 16px 0 0 0; font-size: 13px;">Mark your calendar! Visit the portal for more details.</p>
  `, settings.choirName);

  const to = activeMembers.map(m => ({ email: m.email, name: m.name }));
  await sendEmail(to, subject, html);
}

// ============ DISCIPLINARY NOTIFICATIONS ============

export async function notifyDisciplinaryAction(
  memberEmail: string,
  memberName: string,
  actionType: string,
  severity: string,
  reason: string,
  actionTaken?: string,
  expiryDate?: string
): Promise<void> {
  const settings = await getSettings();
  const typeLabels: Record<string, string> = {
    warning: "Warning",
    suspension: "Suspension",
    fine: "Fine",
    probation: "Probation",
    expulsion: "Expulsion",
    commendation: "Commendation",
  };
  const typeLabel = typeLabels[actionType] || actionType;
  const isPositive = actionType === "commendation";
  const severityColor = severity === "major" ? "#ef4444" : severity === "moderate" ? "#eab308" : "#3b82f6";

  const subject = isPositive
    ? `Commendation: ${memberName}`
    : `Disciplinary Notice: ${typeLabel}`;

  const html = emailWrapper(isPositive ? "Commendation" : "Disciplinary Notice", `
    <p style="color: #e0e0e0; margin: 0 0 12px 0;">Dear <strong>${memberName}</strong>,</p>
    ${isPositive
      ? `<p style="color: #22c55e; margin: 0 0 16px 0;">Congratulations! You have received a commendation from the choir leadership.</p>`
      : `<p style="color: #e0e0e0; margin: 0 0 16px 0;">This is to inform you of a disciplinary action that has been recorded.</p>`
    }
    <table style="width: 100%; border-collapse: collapse;">
      <tr><td style="color: #888; padding: 6px 8px 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">Type:</td><td style="color: #fff; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">${typeLabel}</td></tr>
      ${!isPositive ? `<tr><td style="color: #888; padding: 6px 8px 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">Severity:</td><td style="color: ${severityColor}; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-weight: bold;">${severity.charAt(0).toUpperCase() + severity.slice(1)}</td></tr>` : ""}
      <tr><td style="color: #888; padding: 6px 8px 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">Reason:</td><td style="color: #fff; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">${reason}</td></tr>
      ${actionTaken ? `<tr><td style="color: #888; padding: 6px 8px 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">Action:</td><td style="color: #fff; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">${actionTaken}</td></tr>` : ""}
      ${expiryDate ? `<tr><td style="color: #888; padding: 6px 8px 6px 0;">Expires:</td><td style="color: #fff; padding: 6px 0;">${new Date(expiryDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</td></tr>` : ""}
    </table>
    ${isPositive
      ? `<p style="color: #22c55e; margin: 16px 0 0 0; font-size: 14px;">Keep up the excellent work!</p>`
      : `<p style="color: #e0e0e0; margin: 16px 0 0 0; font-size: 14px;">If you have questions, please reach out to the choir administration.</p>`
    }
  `, settings.choirName);

  await sendEmail([{ email: memberEmail, name: memberName }], subject, html);
}

export async function notifyDisciplinaryResolved(
  memberEmail: string,
  memberName: string,
  actionType: string,
  resolution: string,
  resolvedBy: string
): Promise<void> {
  const settings = await getSettings();
  const typeLabels: Record<string, string> = {
    warning: "Warning",
    suspension: "Suspension",
    fine: "Fine",
    probation: "Probation",
    expulsion: "Expulsion",
    commendation: "Commendation",
  };
  const typeLabel = typeLabels[actionType] || actionType;

  const subject = `Disciplinary Record Resolved: ${typeLabel}`;
  const html = emailWrapper("Record Resolved", `
    <p style="color: #e0e0e0; margin: 0 0 12px 0;">Dear <strong>${memberName}</strong>,</p>
    <p style="color: #22c55e; margin: 0 0 16px 0;">Your disciplinary record (<strong>${typeLabel}</strong>) has been resolved.</p>
    <table style="width: 100%; border-collapse: collapse;">
      <tr><td style="color: #888; padding: 6px 8px 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">Record Type:</td><td style="color: #fff; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">${typeLabel}</td></tr>
      <tr><td style="color: #888; padding: 6px 8px 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">Resolution:</td><td style="color: #22c55e; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">${resolution}</td></tr>
      <tr><td style="color: #888; padding: 6px 8px 6px 0;">Resolved By:</td><td style="color: #fff; padding: 6px 0;">${resolvedBy}</td></tr>
    </table>
    <p style="color: #22c55e; margin: 16px 0 0 0; font-size: 14px;">This matter is now closed. Thank you for your cooperation.</p>
  `, settings.choirName);

  await sendEmail([{ email: memberEmail, name: memberName }], subject, html);
}

// ============ MEMBER STATUS CHANGE NOTIFICATIONS ============

export async function notifyMemberStatusChanged(
  memberEmail: string,
  memberName: string,
  oldStatus: string,
  newStatus: string
): Promise<void> {
  const settings = await getSettings();
  const statusColor = newStatus === "Active" ? "#22c55e" : newStatus === "Inactive" ? "#ef4444" : "#eab308";

  const subject = `Membership Status Update: ${newStatus}`;
  const html = emailWrapper("Membership Status Update", `
    <p style="color: #e0e0e0; margin: 0 0 12px 0;">Dear <strong>${memberName}</strong>,</p>
    <p style="color: #e0e0e0; margin: 0 0 16px 0;">Your membership status has been updated.</p>
    <table style="width: 100%; border-collapse: collapse;">
      <tr><td style="color: #888; padding: 6px 8px 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">Previous Status:</td><td style="color: #fff; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">${oldStatus}</td></tr>
      <tr><td style="color: #888; padding: 6px 8px 6px 0;">New Status:</td><td style="color: ${statusColor}; padding: 6px 0; font-weight: bold;">${newStatus}</td></tr>
    </table>
    ${newStatus === "Active"
      ? `<p style="color: #22c55e; margin: 16px 0 0 0; font-size: 14px;">Welcome! You now have full access to choir activities and the member portal.</p>`
      : newStatus === "Inactive"
      ? `<p style="color: #ef4444; margin: 16px 0 0 0; font-size: 14px;">Your membership has been set to inactive. Please contact the admin team if you have questions.</p>`
      : `<p style="color: #eab308; margin: 16px 0 0 0; font-size: 14px;">Your status is pending. The admin team will review your membership shortly.</p>`
    }
  `, settings.choirName);

  await sendEmail([{ email: memberEmail, name: memberName }], subject, html);
}

// ============ SURVEY PUBLISHED NOTIFICATIONS ============

export async function notifySurveyPublished(
  surveyTitle: string,
  surveyDescription?: string
): Promise<void> {
  const [members, settings] = await Promise.all([getAllMembers(), getSettings()]);
  const activeMembers = members.filter(m => m.status === "Active" && m.email);
  if (activeMembers.length === 0) return;

  const subject = `New Survey: ${surveyTitle}`;
  const html = emailWrapper("New Survey", `
    <h3 style="color: #d4af37; margin: 0 0 12px 0;">${surveyTitle}</h3>
    ${surveyDescription ? `<p style="color: #d0d0d0; margin: 0 0 16px 0; line-height: 1.5;">${surveyDescription}</p>` : ""}
    <p style="color: #e0e0e0; margin: 0 0 8px 0;">A new survey is available for you to complete. Your feedback is important to us!</p>
    <p style="color: #d4af37; margin: 16px 0 0 0; font-size: 13px;">Visit the member portal to submit your response.</p>
  `, settings.choirName);

  const to = activeMembers.map(m => ({ email: m.email, name: m.name }));
  await sendEmail(to, subject, html);
}

// ============ MEETING MINUTES APPROVED NOTIFICATIONS ============

export async function notifyMeetingMinutesApproved(
  meetingTitle: string,
  meetingDate: string,
  approvedBy: string
): Promise<void> {
  const [admins, settings] = await Promise.all([getAllAdminUsers(), getSettings()]);
  const recipients = admins.filter(a => a.isActive && a.email && canApproveMeetingMinutes(a));
  if (recipients.length === 0) return;

  const formattedDate = new Date(meetingDate).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric"
  });

  const subject = `Meeting Minutes Available: ${meetingTitle}`;
  const html = emailWrapper("Meeting Minutes", `
    <h3 style="color: #d4af37; margin: 0 0 16px 0;">${meetingTitle}</h3>
    <table style="width: 100%; border-collapse: collapse;">
      <tr><td style="color: #888; padding: 6px 8px 6px 0;">Date:</td><td style="color: #fff; padding: 6px 0;">${formattedDate}</td></tr>
      <tr><td style="color: #888; padding: 6px 8px 6px 0;">Approved By:</td><td style="color: #fff; padding: 6px 0;">${approvedBy}</td></tr>
    </table>
    <p style="color: #e0e0e0; margin: 16px 0 0 0;">The meeting minutes have been approved and are now available for leadership review in the admin portal.</p>
  `, settings.choirName);

  const to = recipients.map(a => ({ email: a.email, name: a.name }));
  await sendEmail(to, subject, html);
}
