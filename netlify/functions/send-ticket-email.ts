import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

// Resend API for sending emails
// Get your API key from: https://resend.com/api-keys
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || "tickets@serenadesofpraise.com";

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
  // Only allow POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  // Check API key
  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY not configured");
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Email service not configured" }),
    };
  }

  try {
    const data: TicketEmailRequest = JSON.parse(event.body || "{}");
    
    // Validate required fields
    if (!data.to || !data.eventTitle || !data.txRef) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required fields" }),
      };
    }

    // Format tickets list
    const ticketsList = data.tickets
      .map(t => `${t.quantity}x ${t.tierName} - ${formatCurrency(t.priceEach * t.quantity)}`)
      .join("<br>");

    // Create email HTML
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
                <h3 style="margin: 0 0 15px; color: #d4a537; font-size: 18px;">${data.eventTitle}</h3>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 8px 0; color: #888; font-size: 14px;">📅 Date</td>
                    <td style="padding: 8px 0; color: #fff; font-size: 14px; text-align: right;">${data.eventDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #888; font-size: 14px;">🕐 Time</td>
                    <td style="padding: 8px 0; color: #fff; font-size: 14px; text-align: right;">${data.eventTime || "TBA"}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #888; font-size: 14px;">📍 Location</td>
                    <td style="padding: 8px 0; color: #fff; font-size: 14px; text-align: right;">${data.eventLocation}</td>
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
                      <td style="color: #d4a537; font-size: 14px; text-align: right; font-family: monospace;">${data.txRef}</td>
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
                  <li>Keep your reference number safe: <strong>${data.txRef}</strong></li>
                </ul>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; background-color: #151515; text-align: center;">
              <p style="margin: 0 0 10px; color: #888; font-size: 12px;">
                Questions? Contact us at <a href="mailto:info@serenadesofpraise.com" style="color: #d4a537;">info@serenadesofpraise.com</a>
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

    // Send email via Resend
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `Serenades of Praise <${FROM_EMAIL}>`,
        to: [data.to],
        subject: `🎵 Your Ticket for ${data.eventTitle} - Confirmed!`,
        html: emailHtml,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Resend API error:", errorData);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Failed to send email", details: errorData }),
      };
    }

    const result = await response.json();
    
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, messageId: result.id }),
    };
  } catch (error) {
    console.error("Error sending ticket email:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
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

