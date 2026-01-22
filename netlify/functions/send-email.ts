// Netlify Function to send emails via Resend
// Environment variable needed: RESEND_API_KEY

import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

interface EmailRequest {
  to: Array<{ email: string; name: string }>;
  subject: string;
  html: string;
}

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Only allow POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  // Check for API key
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  
  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY not configured");
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Email service not configured" }),
    };
  }

  try {
    const body: EmailRequest = JSON.parse(event.body || "{}");

    if (!body.to || !body.subject || !body.html) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required fields: to, subject, html" }),
      };
    }

    // Send via Resend API
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Serenades of Praise <noreply@theserenades.com>",
        to: body.to.map(r => r.email),
        subject: body.subject,
        html: body.html,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Resend API error:", errorData);
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: errorData.message || "Failed to send email" }),
      };
    }

    const result = await response.json();
    
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        success: true, 
        id: result.id,
        message: `Email sent to ${body.to.length} recipient(s)` 
      }),
    };
  } catch (error: any) {
    console.error("Email send error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || "Internal server error" }),
    };
  }
};

export { handler };
