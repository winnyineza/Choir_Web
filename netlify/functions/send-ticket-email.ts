import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import nodemailer from "nodemailer";

// Gmail SMTP for sending emails
const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

// Email validation
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 20; // max ticket emails per hour per IP
const RATE_LIMIT_WINDOW = 60 * 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || entry.resetTime < now) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

// Sanitize string for HTML
function sanitize(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

interface TicketEmailRequest {
  to: string;
  customerName: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  tickets: Array<{
    tierName: string;
    quantity: number;
    priceEach: number;
  }>;
  total: number;
  txRef: string;
  qrCodeData: string;
}

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  const headers = {
    "Access-Control-Allow-Origin": process.env.URL || "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  // Handle preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  // Only allow POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  // Rate limiting
  const clientIp = event.headers["x-forwarded-for"]?.split(",")[0] || "unknown";
  if (!checkRateLimit(clientIp)) {
    return {
      statusCode: 429,
      headers,
      body: JSON.stringify({ error: "Too many requests" }),
    };
  }

  // Check Gmail credentials
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    console.error("Gmail credentials not configured");
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Email service not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD." }),
    };
  }

  try {
    const data: TicketEmailRequest = JSON.parse(event.body || "{}");
    
    // Validate required fields
    if (!data.to || !data.eventTitle || !data.txRef) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing required fields" }),
      };
    }

    // Validate email
    if (!EMAIL_REGEX.test(data.to)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Invalid email address" }),
      };
    }

    // Validate total is positive
    if (typeof data.total !== "number" || data.total < 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Invalid total amount" }),
      };
    }

    // Sanitize user inputs
    const safeEventTitle = sanitize(data.eventTitle);
    const safeEventDate = sanitize(data.eventDate);
    const safeEventTime = sanitize(data.eventTime);
    const safeEventLocation = sanitize(data.eventLocation);
    const safeTxRef = sanitize(data.txRef);
    const safeCustomerName = sanitize(data.customerName);

    // Format tickets list (sanitize tier names)
    const ticketsList = data.tickets
      .map(t => `${t.quantity}x ${sanitize(t.tierName)} - ${formatCurrency(t.priceEach * t.quantity)}`)
      .join("<br>");

    // Create email HTML with sanitized values
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Ticket Confirmation</title>
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
              <h1 style="margin: 0; color: #000; font-size: 24px; font-weight: bold;">🎵 Serenades of Praise</h1>
              <p style="margin: 10px 0 0; color: #000; font-size: 14px;">Ticket Confirmation</p>
            </td>
          </tr>
          
          <!-- Success Message -->
          <tr>
            <td style="padding: 30px; text-align: center;">
              <div style="width: 60px; height: 60px; background-color: #22c55e20; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 30px;">✓</span>
              </div>
              <h2 style="margin: 0 0 10px; color: #fff; font-size: 22px;">Payment Successful!</h2>
              <p style="margin: 0; color: #888; font-size: 14px;">Your tickets have been confirmed</p>
            </td>
          </tr>
          
          <!-- Event Details -->
          <tr>
            <td style="padding: 0 30px 30px;">
              <div style="background-color: #252525; border-radius: 12px; padding: 20px; border-left: 4px solid #d4a537;">
                <h3 style="margin: 0 0 15px; color: #d4a537; font-size: 18px;">${safeEventTitle}</h3>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 8px 0; color: #888; font-size: 14px;">📅 Date</td>
                    <td style="padding: 8px 0; color: #fff; font-size: 14px; text-align: right;">${safeEventDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #888; font-size: 14px;">🕐 Time</td>
                    <td style="padding: 8px 0; color: #fff; font-size: 14px; text-align: right;">${safeEventTime || "TBA"}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #888; font-size: 14px;">📍 Location</td>
                    <td style="padding: 8px 0; color: #fff; font-size: 14px; text-align: right;">${safeEventLocation}</td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>
          
          <!-- Ticket Details -->
          <tr>
            <td style="padding: 0 30px 30px;">
              <div style="background-color: #252525; border-radius: 12px; padding: 20px;">
                <h4 style="margin: 0 0 15px; color: #fff; font-size: 16px;">Ticket Details</h4>
                <p style="margin: 0 0 10px; color: #ccc; font-size: 14px;">${ticketsList}</p>
                <div style="border-top: 1px solid #333; margin-top: 15px; padding-top: 15px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="color: #888; font-size: 14px;">Reference</td>
                      <td style="color: #d4a537; font-size: 14px; text-align: right; font-family: monospace;">${safeTxRef}</td>
                    </tr>
                    <tr>
                      <td style="padding-top: 10px; color: #fff; font-size: 16px; font-weight: bold;">Total Paid</td>
                      <td style="padding-top: 10px; color: #d4a537; font-size: 18px; font-weight: bold; text-align: right;">${formatCurrency(data.total)}</td>
                    </tr>
                  </table>
                </div>
              </div>
            </td>
          </tr>
          
          <!-- QR Code -->
          <tr>
            <td style="padding: 0 30px 30px; text-align: center;">
              <div style="background-color: #fff; border-radius: 12px; padding: 20px; display: inline-block;">
                <img src="${data.qrCodeData}" alt="Ticket QR Code" width="150" height="150" style="display: block;">
                <p style="margin: 10px 0 0; color: #333; font-size: 12px;">Scan at entrance</p>
              </div>
            </td>
          </tr>
          
          <!-- Instructions -->
          <tr>
            <td style="padding: 0 30px 30px;">
              <div style="background-color: #d4a53720; border-radius: 12px; padding: 20px; border: 1px solid #d4a53740;">
                <h4 style="margin: 0 0 10px; color: #d4a537; font-size: 14px;">📋 Important Information</h4>
                <ul style="margin: 0; padding-left: 20px; color: #ccc; font-size: 13px; line-height: 1.8;">
                  <li>Present this email or screenshot at the entrance</li>
                  <li>Arrive 30 minutes before the event starts</li>
                  <li>This ticket is non-transferable</li>
                  <li>Keep your reference number safe: <strong>${safeTxRef}</strong></li>
                </ul>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; background-color: #151515; text-align: center;">
              <p style="margin: 0 0 10px; color: #888; font-size: 12px;">
                Questions? Contact us at <a href="mailto:theserenadeschoir@gmail.com" style="color: #d4a537;">theserenadeschoir@gmail.com</a>
              </p>
              <p style="margin: 0; color: #666; font-size: 11px;">
                Serenades of Praise Choir • Kacyiru SDA Church, Kigali, Rwanda
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

    // Send email via Gmail SMTP
    const normalizeReadableEmailHtml = (rawHtml: string): string => {
      const tags = ["p", "li", "td", "th", "span", "div", "a"];
      let normalized = rawHtml;

      for (const tag of tags) {
        const withStyleRegex = new RegExp(`<${tag}([^>]*?)style=\"([^\"]*)\"([^>]*)>`, "gi");
        normalized = normalized.replace(withStyleRegex, (_match, before, style, after) => {
          if (/\bcolor\s*:/i.test(style)) {
            return `<${tag}${before}style="${style}"${after}>`;
          }
          const separator = style.trim().endsWith(";") || style.trim().length === 0 ? "" : ";";
          return `<${tag}${before}style="${style}${separator} color: #f5f5f5;"${after}>`;
        });

        const withoutStyleRegex = new RegExp(`<${tag}(?![^>]*style=)([^>]*)>`, "gi");
        normalized = normalized.replace(withoutStyleRegex, `<${tag} style="color: #f5f5f5;"$1>`);
      }

      normalized = normalized.replace(
        /<body(?![^>]*style=)([^>]*)>/gi,
        '<body style="margin: 0; padding: 0; background-color: #0a0a0a; color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif;"$1>',
      );

      return normalized;
    };

    const normalizedHtml = normalizeReadableEmailHtml(emailHtml);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
    });

    const info = await transporter.sendMail({
      from: `"Serenades of Praise" <${GMAIL_USER}>`,
      to: data.to,
      subject: `Your Ticket for ${safeEventTitle} - Confirmed!`,
      html: normalizedHtml,
    });
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, messageId: info.messageId }),
    };
  } catch (error: any) {
    console.error("Error sending ticket email:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || "Internal server error" }),
    };
  }
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-RW", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + " RWF";
}

export { handler };


