import { type Member, type Settings } from "@/lib/dataService";
import { buildAdminPasswordResetEmailHtml } from "@/lib/adminEmailTemplates";
import { generateEmailTemplate } from "@/lib/emailVerificationService";
import {
  buildAdminInviteEmailHtml,
  buildAdminWelcomeEmailHtml,
  generateWelcomeEmailHtml,
} from "@/lib/memberInviteService";
import {
  buildAnnouncementPreviewEmail,
  buildContributionReceiptPreviewEmail,
  buildDisciplinaryActionPreviewEmail,
  buildDisciplinaryResolvedPreviewEmail,
  buildEventCreatedPreviewEmail,
  buildLeaveRequestCreatedPreviewEmail,
  buildLeaveRequestDecisionPreviewEmail,
  buildMeetingMinutesApprovedPreviewEmail,
  buildMemberStatusChangedPreviewEmail,
  buildSurveyPublishedPreviewEmail,
  buildUnlockRequestCreatedPreviewEmail,
  buildUnlockRequestDecisionPreviewEmail,
} from "@/lib/notificationEmailService";

export type EmailPreviewCategory =
  | "access"
  | "requests"
  | "contributions"
  | "communication"
  | "discipline"
  | "automation";

export type EmailPreview = {
  id: string;
  category: EmailPreviewCategory;
  title: string;
  description: string;
  html: string;
};

const LOGO_URL = "https://serenadesofpraise.netlify.app/LogoTSC.jpg";

function buildTicketConfirmationPreviewEmail(): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Ticket Confirmation</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f7fb; color: #172033; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f7fb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border: 1px solid #d9e2ec; border-radius: 16px; overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #d4a537 0%, #b8860b 100%); padding: 30px; text-align: center;">
              <img src="${LOGO_URL}" alt="Serenades of Praise" style="width: 64px; height: 64px; border-radius: 50%; object-fit: cover; border: 3px solid rgba(212, 165, 55, 0.35); margin-bottom: 12px;" />
              <h1 style="margin: 0; color: #000; font-size: 24px; font-weight: bold;">Serenades of Praise</h1>
              <p style="margin: 10px 0 0; color: #000; font-size: 14px;">Ticket Confirmation</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px; text-align: center;">
              <div style="width: 60px; height: 60px; background-color: #22c55e20; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 30px;">✓</span>
              </div>
              <h2 style="margin: 0 0 10px; color: #172033; font-size: 22px;">Payment Successful!</h2>
              <p style="margin: 0; color: #667085; font-size: 14px;">Your tickets have been confirmed</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 30px 30px;">
              <div style="background-color: #f8fafc; border: 1px solid #d9e2ec; border-radius: 12px; padding: 20px; border-left: 4px solid #d4a537;">
                <h3 style="margin: 0 0 15px; color: #d4a537; font-size: 18px;">Voices of Worship Live</h3>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr><td style="padding: 8px 0; color: #667085; font-size: 14px;">Date</td><td style="padding: 8px 0; color: #172033; font-size: 14px; text-align: right;">March 29, 2026</td></tr>
                  <tr><td style="padding: 8px 0; color: #667085; font-size: 14px;">Time</td><td style="padding: 8px 0; color: #172033; font-size: 14px; text-align: right;">6:00 PM</td></tr>
                  <tr><td style="padding: 8px 0; color: #667085; font-size: 14px;">Location</td><td style="padding: 8px 0; color: #172033; font-size: 14px; text-align: right;">Kigali Conference Hall</td></tr>
                </table>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 30px 30px;">
              <div style="background-color: #f8fafc; border: 1px solid #d9e2ec; border-radius: 12px; padding: 20px;">
                <h4 style="margin: 0 0 15px; color: #172033; font-size: 16px;">Ticket Details</h4>
                <p style="margin: 0 0 10px; color: #344054; font-size: 14px;">2x VIP - 20,000 RWF</p>
                <div style="border-top: 1px solid #d9e2ec; margin-top: 15px; padding-top: 15px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr><td style="color: #667085; font-size: 14px;">Reference</td><td style="color: #d4a537; font-size: 14px; text-align: right; font-family: monospace;">TX-9K4L2M</td></tr>
                    <tr><td style="padding-top: 10px; color: #172033; font-size: 16px; font-weight: bold;">Total Paid</td><td style="padding-top: 10px; color: #16a34a; font-size: 18px; font-weight: bold; text-align: right;">20,000 RWF</td></tr>
                  </table>
                </div>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 30px; background-color: #eef2f7; text-align: center;">
              <p style="margin: 0 0 10px; color: #667085; font-size: 12px;">Questions? Contact us at <a href="mailto:theserenadeschoir@gmail.com" style="color: #d4a537;">theserenadeschoir@gmail.com</a></p>
              <p style="margin: 0; color: #98a2b3; font-size: 11px;">Serenades of Praise Choir • Kacyiru SDA Church, Kigali, Rwanda</p>
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

function buildContributionReminderPreviewEmail(): string {
  return `
    <div style="font-family: Arial, sans-serif; background-color: #f5f7fb; color: #172033; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #d9e2ec; border-radius: 12px; padding: 30px;">
        <div style="text-align: center; margin-bottom: 16px;">
          <img src="${LOGO_URL}" alt="Serenades of Praise" style="width: 64px; height: 64px; border-radius: 50%; object-fit: cover; border: 3px solid rgba(212, 165, 55, 0.35); margin-bottom: 12px;" />
        </div>
        <h1 style="color: #d4a537; margin-bottom: 10px;">Contribution Reminder</h1>
        <p>Dear Pacifique,</p>
        <p>This is a friendly reminder about your choir contributions:</p>
        <div style="margin: 20px 0; padding: 15px; background: #fff1f2; border-radius: 8px; border-left: 4px solid #ef4444;">
          <h3 style="color: #ef4444; margin-top: 0;">Unpaid Monthly Dues</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #ffe4e6;">
                <th style="padding: 10px; text-align: left;">Type</th>
                <th style="padding: 10px; text-align: center;">Month</th>
                <th style="padding: 10px; text-align: right;">Amount Due</th>
              </tr>
            </thead>
            <tbody>
              <tr><td style="padding: 10px; border-bottom: 1px solid #fecdd3;">Monthly Dues</td><td style="padding: 10px; border-bottom: 1px solid #fecdd3; text-align: center;">January 2026</td><td style="padding: 10px; border-bottom: 1px solid #fecdd3; text-align: right; color: #ef4444;">1,000 RWF</td></tr>
              <tr><td style="padding: 10px;">Monthly Dues</td><td style="padding: 10px; text-align: center;">February 2026</td><td style="padding: 10px; text-align: right; color: #ef4444;">1,000 RWF</td></tr>
            </tbody>
          </table>
          <p style="margin-top: 15px; font-weight: bold; color: #ef4444;">Total Outstanding: 2,000 RWF</p>
        </div>
        <div style="margin: 20px 0;">
          <h3 style="color: #d4a537;">Special Contributions</h3>
          <table style="width: 100%; border-collapse: collapse; background: #f8fafc; border: 1px solid #d9e2ec; border-radius: 8px;">
            <thead>
              <tr style="background: #eef2f7;">
                <th style="padding: 10px; text-align: left;">Contribution</th>
                <th style="padding: 10px; text-align: right;">Amount</th>
                <th style="padding: 10px; text-align: right;">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr><td style="padding: 10px; border-bottom: 1px solid #d9e2ec;">Easter Offering</td><td style="padding: 10px; border-bottom: 1px solid #d9e2ec; text-align: right;">5,000 RWF</td><td style="padding: 10px; border-bottom: 1px solid #d9e2ec; text-align: right; color: #eab308;">Due Mar 30</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function buildFinanceOverduePreviewEmail(): string {
  return `
    <div style="font-family: Arial, sans-serif; background-color: #f5f7fb; color: #172033; padding: 20px;">
      <div style="max-width: 700px; margin: 0 auto; background: #ffffff; border: 1px solid #d9e2ec; border-radius: 12px; padding: 30px;">
        <div style="text-align: center; margin-bottom: 16px;">
          <img src="${LOGO_URL}" alt="Serenades of Praise" style="width: 64px; height: 64px; border-radius: 50%; object-fit: cover; border: 3px solid rgba(212, 165, 55, 0.35); margin-bottom: 12px;" />
        </div>
        <h1 style="color: #d4a537;">Finance Report: Overdue Contributions</h1>
        <div style="display: flex; gap: 20px; margin: 20px 0;">
          <div style="background: #f8fafc; border: 1px solid #d9e2ec; padding: 15px; border-radius: 8px; flex: 1; text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: #ef4444;">4</div>
            <div style="font-size: 12px; color: #667085;">Members with Overdues</div>
          </div>
          <div style="background: #f8fafc; border: 1px solid #d9e2ec; padding: 15px; border-radius: 8px; flex: 1; text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: #ef4444;">14,000 RWF</div>
            <div style="font-size: 12px; color: #667085;">Total Outstanding</div>
          </div>
        </div>
        <table style="width: 100%; border-collapse: collapse; background: #f8fafc; border: 1px solid #d9e2ec; border-radius: 8px; margin-top: 20px;">
          <thead>
            <tr style="background: #eef2f7;">
              <th style="padding: 10px; text-align: left;">Member</th>
              <th style="padding: 10px; text-align: left;">Email</th>
              <th style="padding: 10px; text-align: center;">Items</th>
              <th style="padding: 10px; text-align: right;">Total Due</th>
            </tr>
          </thead>
          <tbody>
            <tr><td style="padding: 10px; border-bottom: 1px solid #d9e2ec;">Grace Uwineza</td><td style="padding: 10px; border-bottom: 1px solid #d9e2ec;">grace@example.com</td><td style="padding: 10px; border-bottom: 1px solid #d9e2ec; text-align: center;">2 months</td><td style="padding: 10px; border-bottom: 1px solid #d9e2ec; text-align: right; color: #ef4444; font-weight: bold;">2,000 RWF</td></tr>
            <tr><td style="padding: 10px;">Jimmy Niyomutabazi</td><td style="padding: 10px;">jimmy@example.com</td><td style="padding: 10px; text-align: center;">3 months</td><td style="padding: 10px; text-align: right; color: #ef4444; font-weight: bold;">3,000 RWF</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function buildBirthdayReminderPreviewEmail(): string {
  return `
    <div style="font-family: Arial, sans-serif; background-color: #f5f7fb; color: #172033; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 30px;">
        <div style="text-align: center; margin-bottom: 16px;">
          <img src="${LOGO_URL}" alt="Serenades of Praise" style="width: 64px; height: 64px; border-radius: 50%; object-fit: cover; border: 3px solid rgba(212, 165, 55, 0.35); margin-bottom: 12px;" />
        </div>
        <h1 style="color: #d4a537; margin-bottom: 20px;">Upcoming Birthdays!</h1>
        <p>Next birthday is in <strong>3 days</strong>. Here are all upcoming birthdays within the next 7 days:</p>
        <ul style="list-style: none; padding: 0;">
          <li style="padding: 10px 15px; background: #f0f1f3; margin-bottom: 8px; border-radius: 8px; border-left: 4px solid #d4a537;"><strong>Aimable Nikwigize</strong> - March 19 <span style="color: #d4a537;">(in 3 days)</span></li>
          <li style="padding: 10px 15px; background: #f0f1f3; margin-bottom: 8px; border-radius: 8px; border-left: 4px solid #d4a537;"><strong>Ganza Patricie</strong> - March 22 <span style="color: #d4a537;">(in 6 days)</span></li>
        </ul>
      </div>
    </div>
  `;
}

function buildPersonalBirthdayPreviewEmail(): string {
  return `
    <div style="margin: 0; padding: 20px; background-color: #f5f7fb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; border: 1px solid #d9e2ec; border-radius: 16px; overflow: hidden;">
            <tr><td style="background: linear-gradient(135deg, #d4a537 0%, #b8860b 100%); padding: 40px; text-align: center;">
              <img src="${LOGO_URL}" alt="Serenades of Praise" style="width: 64px; height: 64px; border-radius: 50%; object-fit: cover; border: 3px solid rgba(212, 165, 55, 0.35); margin-bottom: 12px;" />
              <div style="font-size: 60px; margin-bottom: 10px;">🎂</div>
              <h1 style="margin: 0; color: #000; font-size: 28px; font-weight: bold;">Happy Birthday, Pacifique!</h1>
              <p style="margin: 10px 0 0; color: #000; font-size: 16px;">Celebrating you today</p>
            </td></tr>
            <tr><td style="padding: 30px; text-align: center;">
              <p style="color: #475467; font-size: 16px; line-height: 1.8; margin: 0 0 20px;">On this beautiful day, the entire Serenades of Praise family sends you our warmest birthday blessings!</p>
              <div style="background: linear-gradient(135deg, #d4a53720 0%, #b8860b15 100%); border-radius: 12px; padding: 25px; border: 1px solid #d4a53740;">
                <p style="color: #172033; font-size: 16px; line-height: 1.8; font-style: italic; margin: 0 0 12px;">"The LORD bless you and keep you; the LORD make his face shine on you and be gracious to you."</p>
                <p style="color: #d4a537; font-size: 14px; font-weight: bold; margin: 0;">— Numbers 6:24-26</p>
              </div>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </div>
  `;
}

function buildBirthdayNotificationPreviewEmail(): string {
  return `
    <div style="margin: 0; padding: 20px; background-color: #f5f7fb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border: 1px solid #d9e2ec; border-radius: 16px; overflow: hidden;">
            <tr><td style="background: linear-gradient(135deg, #d4a537 0%, #b8860b 100%); padding: 30px; text-align: center;">
              <img src="${LOGO_URL}" alt="Serenades of Praise" style="width: 64px; height: 64px; border-radius: 50%; object-fit: cover; border: 3px solid rgba(212, 165, 55, 0.35); margin-bottom: 12px;" />
              <div style="font-size: 40px; margin-bottom: 8px;">🎉</div>
              <h1 style="margin: 0; color: #000; font-size: 22px; font-weight: bold;">Birthday Celebration!</h1>
              <p style="margin: 8px 0 0; color: #000; font-size: 14px;">Let's celebrate our choir members today</p>
            </td></tr>
            <tr><td style="padding: 30px;">
              <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 12px; text-align: center; border: 1px solid #d4a53730;">
                <div style="font-size: 40px; margin-bottom: 8px;">🎂</div>
                <p style="color: #d4a537; font-size: 20px; font-weight: bold; margin: 0 0 4px;">Aimable Nikwigize</p>
                <p style="color: #667085; font-size: 13px; margin: 0;">Send Aimable a birthday wish today!</p>
              </div>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </div>
  `;
}

function buildEventReminderPreviewEmail(): string {
  return `
    <div style="font-family: Arial, sans-serif; background-color: #f5f7fb; color: #172033; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #d9e2ec; border-radius: 12px; padding: 30px;">
        <div style="text-align: center; margin-bottom: 16px;">
          <img src="${LOGO_URL}" alt="Serenades of Praise" style="width: 64px; height: 64px; border-radius: 50%; object-fit: cover; border: 3px solid rgba(212, 165, 55, 0.35); margin-bottom: 12px;" />
        </div>
        <h1 style="color: #d4a537; margin-bottom: 20px;">Event Reminder - Tomorrow!</h1>
        <div style="padding: 15px; background: #f8fafc; border: 1px solid #d9e2ec; margin-bottom: 10px; border-radius: 8px; border-left: 4px solid #d4a537;">
          <strong style="color: #d4a537; font-size: 16px;">Youth Praise Night</strong><br>
          <span style="color: #667085;">March 20, 2026</span><br>
          <span style="color: #667085;">6:30 PM</span><br>
          <span style="color: #667085;">Kacyiru SDA Church Hall</span>
        </div>
      </div>
    </div>
  `;
}

function buildMeetingReminderPreviewEmail(): string {
  return `
    <div style="font-family: Arial, sans-serif; background-color: #f5f7fb; color: #172033; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #d9e2ec; border-radius: 12px; padding: 30px;">
        <div style="text-align: center; margin-bottom: 16px;">
          <img src="${LOGO_URL}" alt="Serenades of Praise" style="width: 64px; height: 64px; border-radius: 50%; object-fit: cover; border: 3px solid rgba(212, 165, 55, 0.35); margin-bottom: 12px;" />
        </div>
        <h1 style="color: #d4a537; margin-bottom: 20px;">Meeting Reminder - Tomorrow</h1>
        <p>Hi Winny,</p>
        <div style="padding: 15px; background: #f8fafc; border: 1px solid #d9e2ec; margin-bottom: 10px; border-radius: 8px; border-left: 4px solid #d4a537;">
          <strong style="color: #d4a537; font-size: 16px;">Finance Review Meeting</strong><br>
          <span style="color: #667085;">March 20, 2026</span><br>
          <span style="color: #667085;">4:00 PM</span><br>
          <span style="color: #667085;">Committee Room</span><br>
          <a href="https://meet.google.com/example-link" style="color: #d4a537; text-decoration: none;">Join Google Meet</a>
        </div>
      </div>
    </div>
  `;
}

export function buildEmailPreviewCatalog(
  settings: Settings,
  previewMember: Partial<Member>,
  portalUrl: string,
  adminUrl: string,
): EmailPreview[] {
  const choirName = settings.choirName || "Serenades of Praise Choir";

  return [
    {
      id: "verification",
      category: "access",
      title: "Verification Code",
      description: "Sent during leave verification and member confirmation flows.",
      html: generateEmailTemplate("Winny Ineza", "483920"),
    },
    {
      id: "member-invite",
      category: "access",
      title: "Member Invite",
      description: "Portal invitation email sent to newly added choir members.",
      html: generateWelcomeEmailHtml(previewMember, settings.memberPortalPin || "2024", portalUrl),
    },
    {
      id: "admin-invite",
      category: "access",
      title: "Admin Invite",
      description: "One-time invite for onboarding a new admin.",
      html: buildAdminInviteEmailHtml(
        "samuel.admin@example.com",
        "Samuel Rugamba",
        "Finance Admin",
        "INV-7H2FQ9",
        `${adminUrl}/login?invite=INV-7H2FQ9`,
      ),
    },
    {
      id: "admin-welcome",
      category: "access",
      title: "Admin Welcome",
      description: "Confirmation email after an admin account is created.",
      html: buildAdminWelcomeEmailHtml("samuel.admin@example.com", "Samuel Rugamba", "Finance Admin", adminUrl),
    },
    {
      id: "admin-password-reset",
      category: "access",
      title: "Admin Password Reset",
      description: "Reset email used when an admin requests a new password link.",
      html: buildAdminPasswordResetEmailHtml(`${adminUrl}/login?reset=preview-token-123`),
    },
    {
      id: "leave-request",
      category: "requests",
      title: "Leave Request Notification",
      description: "Approval alert sent to leave approvers.",
      html: buildLeaveRequestCreatedPreviewEmail(choirName),
    },
    {
      id: "leave-approved",
      category: "requests",
      title: "Leave Approved",
      description: "Decision email sent to the member after approval.",
      html: buildLeaveRequestDecisionPreviewEmail(choirName, "approved"),
    },
    {
      id: "leave-denied",
      category: "requests",
      title: "Leave Denied",
      description: "Decision email sent to the member after denial.",
      html: buildLeaveRequestDecisionPreviewEmail(choirName, "denied"),
    },
    {
      id: "unlock-request",
      category: "requests",
      title: "Unlock Request Created",
      description: "Alert to senior admins when a locked month unlock is requested.",
      html: buildUnlockRequestCreatedPreviewEmail(choirName),
    },
    {
      id: "unlock-approved",
      category: "requests",
      title: "Unlock Approved",
      description: "Decision email when an unlock request is approved.",
      html: buildUnlockRequestDecisionPreviewEmail(choirName, "approved"),
    },
    {
      id: "unlock-denied",
      category: "requests",
      title: "Unlock Denied",
      description: "Decision email when an unlock request is denied.",
      html: buildUnlockRequestDecisionPreviewEmail(choirName, "denied"),
    },
    {
      id: "contribution-receipt",
      category: "contributions",
      title: "Contribution Receipt",
      description: "Receipt notification email after a contribution is recorded.",
      html: buildContributionReceiptPreviewEmail(choirName),
    },
    {
      id: "ticket-confirmation",
      category: "contributions",
      title: "Ticket Confirmation",
      description: "Confirmation email sent after a successful event ticket purchase.",
      html: buildTicketConfirmationPreviewEmail(),
    },
    {
      id: "contribution-reminder",
      category: "contributions",
      title: "Contribution Reminder",
      description: "Automated reminder for overdue or upcoming contributions.",
      html: buildContributionReminderPreviewEmail(),
    },
    {
      id: "finance-overdue",
      category: "contributions",
      title: "Finance Overdue Digest",
      description: "Automated finance summary of members with outstanding balances.",
      html: buildFinanceOverduePreviewEmail(),
    },
    {
      id: "announcement",
      category: "communication",
      title: "Announcement",
      description: "Broadcast email used for choir-wide announcements.",
      html: buildAnnouncementPreviewEmail(choirName),
    },
    {
      id: "event-created",
      category: "communication",
      title: "New Event",
      description: "Event announcement email sent to active members.",
      html: buildEventCreatedPreviewEmail(choirName),
    },
    {
      id: "survey-published",
      category: "communication",
      title: "Survey Published",
      description: "Email inviting members to respond to a new survey.",
      html: buildSurveyPublishedPreviewEmail(choirName),
    },
    {
      id: "meeting-minutes",
      category: "communication",
      title: "Meeting Minutes Approved",
      description: "Leadership notification after meeting minutes are approved.",
      html: buildMeetingMinutesApprovedPreviewEmail(choirName),
    },
    {
      id: "disciplinary-action",
      category: "discipline",
      title: "Disciplinary Action",
      description: "Formal disciplinary notice sent to a member.",
      html: buildDisciplinaryActionPreviewEmail(choirName),
    },
    {
      id: "disciplinary-resolved",
      category: "discipline",
      title: "Disciplinary Resolved",
      description: "Resolution email when a disciplinary record is closed.",
      html: buildDisciplinaryResolvedPreviewEmail(choirName),
    },
    {
      id: "member-status",
      category: "discipline",
      title: "Member Status Changed",
      description: "Status update email after a membership change.",
      html: buildMemberStatusChangedPreviewEmail(choirName),
    },
    {
      id: "birthday-reminder",
      category: "automation",
      title: "Upcoming Birthday Digest",
      description: "Automated admin reminder about birthdays coming up soon.",
      html: buildBirthdayReminderPreviewEmail(),
    },
    {
      id: "personal-birthday",
      category: "automation",
      title: "Personal Birthday Blessing",
      description: "Automated birthday blessing sent directly to the member.",
      html: buildPersonalBirthdayPreviewEmail(),
    },
    {
      id: "birthday-notification",
      category: "automation",
      title: "Birthday Announcement",
      description: "Automated choir-wide celebration notice on the member's birthday.",
      html: buildBirthdayNotificationPreviewEmail(),
    },
    {
      id: "event-reminder",
      category: "automation",
      title: "Event Reminder",
      description: "Automated reminder for upcoming events happening tomorrow.",
      html: buildEventReminderPreviewEmail(),
    },
    {
      id: "meeting-reminder",
      category: "automation",
      title: "Meeting Reminder",
      description: "Automated reminder for upcoming meetings, including Google Meet links.",
      html: buildMeetingReminderPreviewEmail(),
    },
  ];
}
