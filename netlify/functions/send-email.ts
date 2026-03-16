// Netlify Function to send emails via Gmail SMTP
// Environment variables needed: GMAIL_USER, GMAIL_APP_PASSWORD

import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import nodemailer from "nodemailer";

interface EmailRequest {
  to: Array<{ email: string; name: string }>;
  subject: string;
  html: string;
}

// Email validation regex
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// Simple in-memory rate limiting (resets on cold start)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 50;
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

// Sanitize HTML to prevent XSS
function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "");
}

function normalizeReadableEmailHtml(html: string): string {
  const tags = ["p", "li", "td", "th", "span", "div", "a"];
  let normalized = html;
  const defaultTextColor = "#172033";
  const defaultBodyStyle = `margin: 0; padding: 0; background-color: #f5f7fb; color: ${defaultTextColor}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;`;

  for (const tag of tags) {
    const withStyleRegex = new RegExp(`<${tag}([^>]*?)style=\"([^\"]*)\"([^>]*)>`, "gi");
    normalized = normalized.replace(withStyleRegex, (_match, before, style, after) => {
      if (/\bcolor\s*:/i.test(style)) {
        return `<${tag}${before}style="${style}"${after}>`;
      }
      const separator = style.trim().endsWith(";") || style.trim().length === 0 ? "" : ";";
      return `<${tag}${before}style="${style}${separator} color: ${defaultTextColor};"${after}>`;
    });

    const withoutStyleRegex = new RegExp(`<${tag}(?![^>]*style=)([^>]*)>`, "gi");
    normalized = normalized.replace(withoutStyleRegex, `<${tag} style="color: ${defaultTextColor};"$1>`);
  }

  normalized = normalized.replace(
    /<meta\s+name=["']color-scheme["'][^>]*>/gi,
    "",
  );
  normalized = normalized.replace(
    /<meta\s+name=["']supported-color-schemes["'][^>]*>/gi,
    "",
  );
  normalized = normalized.replace(
    /<head([^>]*)>/i,
    `<head$1><meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark">`,
  );

  normalized = normalized.replace(
    /<body([^>]*?)style="([^"]*)"([^>]*)>/gi,
    (_match, before, style, after) => {
      let nextStyle = style
        .replace(/background-color\s*:\s*#0a0a0a/gi, "background-color: #f5f7fb")
        .replace(/background-color\s*:\s*#0c0a09/gi, "background-color: #f5f7fb")
        .replace(/color\s*:\s*#f5f5f5/gi, `color: ${defaultTextColor}`);

      if (!/\bbackground-color\s*:/i.test(nextStyle)) {
        nextStyle = `${nextStyle}${nextStyle.trim().endsWith(";") || nextStyle.trim().length === 0 ? "" : ";"} background-color: #f5f7fb;`;
      }
      if (!/\bcolor\s*:/i.test(nextStyle)) {
        nextStyle = `${nextStyle}${nextStyle.trim().endsWith(";") || nextStyle.trim().length === 0 ? "" : ";"} color: ${defaultTextColor};`;
      }
      if (!/\bfont-family\s*:/i.test(nextStyle)) {
        nextStyle = `${nextStyle}${nextStyle.trim().endsWith(";") || nextStyle.trim().length === 0 ? "" : ";"} font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;`;
      }

      return `<body${before}style="${nextStyle}"${after}>`;
    },
  );

  normalized = normalized.replace(
    /<body(?![^>]*style=)([^>]*)>/gi,
    `<body style="${defaultBodyStyle}"$1>`,
  );

  return normalized;
}

// Create Gmail SMTP transporter
function createTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  
  if (!user || !pass) {
    throw new Error("Gmail credentials not configured");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

const handler: Handler = async (event: HandlerEvent, _context: HandlerContext) => {
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

  // Check for Gmail credentials
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.error("Gmail credentials not configured");
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Email service not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD." }),
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
    const normalizedHtml = normalizeReadableEmailHtml(sanitizedHtml);

    // Send via Gmail SMTP
    const transporter = createTransporter();
    const toAddresses = body.to.map(r => `${r.name} <${r.email}>`).join(", ");

    const info = await transporter.sendMail({
      from: `"Serenades of Praise" <${process.env.GMAIL_USER}>`,
      to: toAddresses,
      subject: body.subject,
      html: normalizedHtml,
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        id: info.messageId,
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
