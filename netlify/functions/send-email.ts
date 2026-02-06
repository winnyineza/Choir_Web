// Netlify Function to send emails via Resend
// Environment variable needed: RESEND_API_KEY

import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

interface EmailRequest {
  to: Array<{ email: string; name: string }>;
  subject: string;
  html: string;
}

// Email validation regex
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// Simple in-memory rate limiting (resets on cold start)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 50; // max emails per window
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  
  if (!entry || entry.resetTime < now) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }
  
  entry.count++;
  return true;
}

// Sanitize HTML to prevent XSS (basic)
function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "");
}

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // CORS headers
  const headers = {
    "Access-Control-Allow-Origin": process.env.URL || "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
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
      body: JSON.stringify({ error: "Too many requests. Please try again later." }),
    };
  }

  // Check for API key
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  
  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY not configured");
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Email service not configured" }),
    };
  }

  try {
    const body: EmailRequest = JSON.parse(event.body || "{}");

    // Validate required fields
    if (!body.to || !body.subject || !body.html) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing required fields: to, subject, html" }),
      };
    }

    // Validate email addresses
    if (!Array.isArray(body.to) || body.to.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Invalid recipients list" }),
      };
    }

    for (const recipient of body.to) {
      if (!recipient.email || !EMAIL_REGEX.test(recipient.email)) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: `Invalid email address: ${recipient.email}` }),
        };
      }
    }

    // Validate subject length
    if (body.subject.length > 200) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Subject line too long (max 200 characters)" }),
      };
    }

    // Sanitize HTML content
    const sanitizedHtml = sanitizeHtml(body.html);

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
        html: sanitizedHtml,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Resend API error:", errorData);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ error: errorData.message || "Failed to send email" }),
      };
    }

    const result = await response.json();
    
    return {
      statusCode: 200,
      headers,
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
      headers,
      body: JSON.stringify({ error: error.message || "Internal server error" }),
    };
  }
};

export { handler };
