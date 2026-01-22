// Email Service - Send emails via Resend or Netlify Functions
// Supports: Birthday reminders, Leave notifications, Receipts, Event reminders

// ============ CONFIGURATION ============

const NETLIFY_FUNCTION_URL = '/.netlify/functions';

// ============ TYPES ============

export type EmailTemplate = 
  | 'birthday_reminder'
  | 'leave_request'
  | 'leave_approved'
  | 'leave_denied'
  | 'contribution_receipt'
  | 'event_reminder'
  | 'welcome'
  | 'password_reset'
  | 'announcement';

export interface EmailRecipient {
  email: string;
  name: string;
}

export interface EmailRequest {
  to: EmailRecipient | EmailRecipient[];
  template: EmailTemplate;
  data: Record<string, any>;
  subject?: string; // Override default subject
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ============ EMAIL TEMPLATES ============

const EMAIL_TEMPLATES: Record<EmailTemplate, { subject: string; html: (data: any) => string }> = {
  birthday_reminder: {
    subject: '🎂 Birthday Reminder - {name}',
    html: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #D4AF37, #B8860B); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">🎂 Birthday Reminder</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <p style="font-size: 16px; color: #333;">Hello Admin,</p>
          <p style="font-size: 16px; color: #333;">
            This is a reminder that <strong>${data.memberName}</strong> has a birthday 
            ${data.daysUntil === 0 ? 'today!' : `in ${data.daysUntil} day(s) on ${data.birthdayDate}`}.
          </p>
          <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #666;">
              <strong>Voice Part:</strong> ${data.voicePart}<br>
              <strong>Member Since:</strong> ${data.joinedDate}
            </p>
          </div>
          <p style="font-size: 14px; color: #666;">
            Consider sending birthday wishes to the choir group! 🎉
          </p>
        </div>
        <div style="padding: 20px; text-align: center; background: #333; color: white;">
          <p style="margin: 0; font-size: 12px;">Serenades of Praise Choir</p>
        </div>
      </div>
    `,
  },

  leave_request: {
    subject: 'Leave Request from {memberName}',
    html: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #4F46E5; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">📋 Leave Request</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <p style="font-size: 16px; color: #333;">Hello Admin,</p>
          <p style="font-size: 16px; color: #333;">
            <strong>${data.memberName}</strong> has submitted a leave request.
          </p>
          <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #4F46E5;">
            <p style="margin: 0 0 10px 0; font-size: 14px; color: #333;">
              <strong>Period:</strong> ${data.startDate} to ${data.endDate}
            </p>
            <p style="margin: 0; font-size: 14px; color: #333;">
              <strong>Reason:</strong> ${data.reason}
            </p>
          </div>
          <p style="font-size: 14px; color: #666;">
            Please review and approve/deny this request in the admin portal.
          </p>
          <a href="${data.adminUrl}" style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">
            Review Request
          </a>
        </div>
      </div>
    `,
  },

  leave_approved: {
    subject: '✅ Leave Request Approved',
    html: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #22C55E; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">✅ Leave Approved</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <p style="font-size: 16px; color: #333;">Hello ${data.memberName},</p>
          <p style="font-size: 16px; color: #333;">
            Great news! Your leave request has been <strong style="color: #22C55E;">approved</strong>.
          </p>
          <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #333;">
              <strong>Approved Period:</strong> ${data.startDate} to ${data.endDate}
            </p>
          </div>
          <p style="font-size: 14px; color: #666;">
            We hope you have a restful time. See you when you return!
          </p>
        </div>
      </div>
    `,
  },

  leave_denied: {
    subject: '❌ Leave Request Update',
    html: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #EF4444; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Leave Request Update</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <p style="font-size: 16px; color: #333;">Hello ${data.memberName},</p>
          <p style="font-size: 16px; color: #333;">
            Unfortunately, your leave request for ${data.startDate} to ${data.endDate} 
            could not be approved at this time.
          </p>
          ${data.reason ? `
          <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #666;">
              <strong>Reason:</strong> ${data.reason}
            </p>
          </div>
          ` : ''}
          <p style="font-size: 14px; color: #666;">
            Please contact the choir leadership if you have any questions.
          </p>
        </div>
      </div>
    `,
  },

  contribution_receipt: {
    subject: 'Receipt: {type} - {amount}',
    html: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #D4AF37, #B8860B); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">🧾 Contribution Receipt</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <p style="font-size: 16px; color: #333;">Hello ${data.memberName},</p>
          <p style="font-size: 16px; color: #333;">
            Thank you for your contribution to Serenades of Praise Choir!
          </p>
          <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0; border: 2px solid #D4AF37;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Receipt #:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;">${data.receiptNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Date:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;">${data.date}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Type:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;">${data.type}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Amount:</strong></td>
                <td style="padding: 8px 0; text-align: right; font-size: 18px; color: #D4AF37;"><strong>${data.amount}</strong></td>
              </tr>
            </table>
          </div>
          <p style="font-size: 14px; color: #666;">
            God bless you for your generous support! 🙏
          </p>
        </div>
        <div style="padding: 20px; text-align: center; background: #333; color: white;">
          <p style="margin: 0; font-size: 12px;">Serenades of Praise Choir • Kacyiru SDA Church, Kigali</p>
        </div>
      </div>
    `,
  },

  event_reminder: {
    subject: '📅 Reminder: {eventTitle} - {eventDate}',
    html: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #8B5CF6, #6D28D9); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">📅 Event Reminder</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <p style="font-size: 16px; color: #333;">Hello ${data.memberName},</p>
          <p style="font-size: 16px; color: #333;">
            This is a reminder about an upcoming event:
          </p>
          <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h2 style="margin: 0 0 15px 0; color: #8B5CF6;">${data.eventTitle}</h2>
            <p style="margin: 5px 0; font-size: 14px; color: #333;">
              📅 <strong>Date:</strong> ${data.eventDate}
            </p>
            <p style="margin: 5px 0; font-size: 14px; color: #333;">
              🕐 <strong>Time:</strong> ${data.eventTime}
            </p>
            <p style="margin: 5px 0; font-size: 14px; color: #333;">
              📍 <strong>Location:</strong> ${data.eventLocation}
            </p>
          </div>
          <p style="font-size: 14px; color: #666;">
            We look forward to seeing you there!
          </p>
        </div>
      </div>
    `,
  },

  welcome: {
    subject: 'Welcome to Serenades of Praise Choir! 🎵',
    html: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #D4AF37, #B8860B); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">🎵 Welcome to the Family!</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <p style="font-size: 18px; color: #333;">Hello ${data.memberName},</p>
          <p style="font-size: 16px; color: #333;">
            Welcome to <strong>Serenades of Praise Choir</strong>! We're thrilled to have you join our musical family.
          </p>
          <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #666;">
              <strong>Your Voice Part:</strong> ${data.voicePart}<br>
              <strong>Joined:</strong> ${data.joinedDate}
            </p>
          </div>
          <p style="font-size: 14px; color: #666;">
            Access the member portal to view announcements, events, and your contribution history.
          </p>
          <a href="${data.portalUrl}" style="display: inline-block; background: #D4AF37; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">
            Access Member Portal
          </a>
        </div>
      </div>
    `,
  },

  password_reset: {
    subject: 'Reset Your Password',
    html: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #333; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">🔐 Password Reset</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <p style="font-size: 16px; color: #333;">Hello ${data.name},</p>
          <p style="font-size: 16px; color: #333;">
            We received a request to reset your password. Click the button below to create a new password.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.resetUrl}" style="display: inline-block; background: #D4AF37; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Reset Password
            </a>
          </div>
          <p style="font-size: 14px; color: #666;">
            This link expires in 1 hour. If you didn't request this, please ignore this email.
          </p>
        </div>
      </div>
    `,
  },

  announcement: {
    subject: '📢 {title}',
    html: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: ${data.priority === 'urgent' ? '#EF4444' : data.priority === 'high' ? '#F59E0B' : '#4F46E5'}; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">📢 ${data.title}</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <p style="font-size: 16px; color: #333;">${data.content}</p>
          ${data.actionUrl ? `
          <a href="${data.actionUrl}" style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
            ${data.actionText || 'Learn More'}
          </a>
          ` : ''}
        </div>
        <div style="padding: 20px; text-align: center; background: #333; color: white;">
          <p style="margin: 0; font-size: 12px;">Serenades of Praise Choir</p>
        </div>
      </div>
    `,
  },
};

// ============ SEND EMAIL FUNCTIONS ============

export async function sendEmail(request: EmailRequest): Promise<EmailResult> {
  const template = EMAIL_TEMPLATES[request.template];
  
  if (!template) {
    return { success: false, error: `Unknown template: ${request.template}` };
  }

  // Generate subject with data substitution
  let subject = request.subject || template.subject;
  Object.keys(request.data).forEach(key => {
    subject = subject.replace(`{${key}}`, request.data[key]);
  });

  // Generate HTML
  const html = template.html(request.data);

  // Convert single recipient to array
  const recipients = Array.isArray(request.to) ? request.to : [request.to];

  try {
    // Send via Netlify function
    const response = await fetch(`${NETLIFY_FUNCTION_URL}/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: recipients.map(r => ({ email: r.email, name: r.name })),
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error };
    }

    const result = await response.json();
    return { success: true, messageId: result.id };
  } catch (error: any) {
    console.error('Email send error:', error);
    
    // If Netlify function fails, queue email for later
    queueEmail({ ...request, subject });
    
    return { 
      success: false, 
      error: 'Email queued - will be sent when connection is restored' 
    };
  }
}

// ============ SPECIFIC EMAIL FUNCTIONS ============

export async function sendBirthdayReminder(
  adminEmail: string,
  member: { name: string; voicePart: string; joinedDate: string; birthdayDate: string },
  daysUntil: number
): Promise<EmailResult> {
  return sendEmail({
    to: { email: adminEmail, name: 'Admin' },
    template: 'birthday_reminder',
    data: {
      memberName: member.name,
      voicePart: member.voicePart,
      joinedDate: member.joinedDate,
      birthdayDate: member.birthdayDate,
      daysUntil,
    },
  });
}

export async function sendLeaveRequestNotification(
  adminEmails: string[],
  member: { name: string },
  leave: { startDate: string; endDate: string; reason: string }
): Promise<EmailResult> {
  return sendEmail({
    to: adminEmails.map(email => ({ email, name: 'Admin' })),
    template: 'leave_request',
    data: {
      memberName: member.name,
      startDate: leave.startDate,
      endDate: leave.endDate,
      reason: leave.reason,
      adminUrl: `${window.location.origin}/admin?tab=leave`,
    },
  });
}

export async function sendLeaveApprovalNotification(
  memberEmail: string,
  memberName: string,
  leave: { startDate: string; endDate: string },
  approved: boolean,
  reason?: string
): Promise<EmailResult> {
  return sendEmail({
    to: { email: memberEmail, name: memberName },
    template: approved ? 'leave_approved' : 'leave_denied',
    data: {
      memberName,
      startDate: leave.startDate,
      endDate: leave.endDate,
      reason,
    },
  });
}

export async function sendContributionReceipt(
  memberEmail: string,
  memberName: string,
  contribution: { receiptNumber: string; date: string; type: string; amount: string }
): Promise<EmailResult> {
  return sendEmail({
    to: { email: memberEmail, name: memberName },
    template: 'contribution_receipt',
    data: {
      memberName,
      receiptNumber: contribution.receiptNumber,
      date: contribution.date,
      type: contribution.type,
      amount: contribution.amount,
    },
  });
}

export async function sendEventReminder(
  recipients: EmailRecipient[],
  event: { title: string; date: string; time: string; location: string }
): Promise<EmailResult> {
  return sendEmail({
    to: recipients,
    template: 'event_reminder',
    data: {
      eventTitle: event.title,
      eventDate: event.date,
      eventTime: event.time,
      eventLocation: event.location,
    },
  });
}

export async function sendWelcomeEmail(
  memberEmail: string,
  memberName: string,
  voicePart: string,
  joinedDate: string
): Promise<EmailResult> {
  return sendEmail({
    to: { email: memberEmail, name: memberName },
    template: 'welcome',
    data: {
      memberName,
      voicePart,
      joinedDate,
      portalUrl: `${window.location.origin}/member-portal`,
    },
  });
}

// ============ EMAIL QUEUE (Offline Support) ============

const EMAIL_QUEUE_KEY = 'choir_email_queue';

function queueEmail(request: EmailRequest & { subject: string }): void {
  const queue = JSON.parse(localStorage.getItem(EMAIL_QUEUE_KEY) || '[]');
  queue.push({
    ...request,
    queuedAt: new Date().toISOString(),
  });
  localStorage.setItem(EMAIL_QUEUE_KEY, JSON.stringify(queue));
}

export function getQueuedEmails(): Array<EmailRequest & { queuedAt: string }> {
  return JSON.parse(localStorage.getItem(EMAIL_QUEUE_KEY) || '[]');
}

export async function processEmailQueue(): Promise<{ sent: number; failed: number }> {
  const queue = getQueuedEmails();
  let sent = 0;
  let failed = 0;
  const remaining: typeof queue = [];

  for (const email of queue) {
    const result = await sendEmail(email);
    if (result.success) {
      sent++;
    } else {
      // Keep in queue if still failing
      if (!result.error?.includes('queued')) {
        failed++;
      }
      remaining.push(email);
    }
  }

  localStorage.setItem(EMAIL_QUEUE_KEY, JSON.stringify(remaining));
  return { sent, failed };
}
