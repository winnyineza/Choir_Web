import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export type AdminRecord = {
  id: string;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
};

export interface GoogleIntegrationRecord {
  id: string;
  google_email: string;
  calendar_id: string;
  refresh_token_ciphertext: string;
  refresh_token_iv: string;
  refresh_token_tag: string;
  scope: string | null;
  connected_by_admin_id: string;
  connected_at: string;
  revoked_at: string | null;
  updated_at: string;
}

export const ALLOWED_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/userinfo.email",
  "openid",
];
export const GOOGLE_INTEGRATION_ID = "primary";

export function buildHeaders() {
  return {
    "Access-Control-Allow-Origin": process.env.URL || "*",
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Id",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Content-Type": "application/json",
  };
}

export function getSupabaseAdminClient() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const missing: string[] = [];
  if (!url) missing.push("SUPABASE_URL");
  if (!serviceKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");

  if (missing.length > 0) {
    throw new Error(`Missing environment variable(s): ${missing.join(", ")}`);
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function getAdminIdFromHeaders(headers: Record<string, string | undefined>) {
  return headers["x-admin-id"] || headers["X-Admin-Id"];
}

export async function requireActiveAdmin(headers: Record<string, string | undefined>) {
  const adminId = getAdminIdFromHeaders(headers);
  if (!adminId) {
    throw new Error("Missing X-Admin-Id header");
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("admin_users")
    .select("id, email, name, role, is_active")
    .eq("id", adminId)
    .single();

  if (error || !data || !data.is_active) {
    throw new Error("Unauthorized admin");
  }

  return data as AdminRecord;
}

function getTokenKeyBuffer() {
  const raw = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error("Missing GOOGLE_TOKEN_ENCRYPTION_KEY");
  }

  let key: Buffer;
  try {
    key = Buffer.from(raw, "base64");
  } catch {
    throw new Error("GOOGLE_TOKEN_ENCRYPTION_KEY must be base64-encoded");
  }

  if (key.length !== 32) {
    throw new Error("GOOGLE_TOKEN_ENCRYPTION_KEY must decode to 32 bytes");
  }

  return key;
}

export function encryptRefreshToken(refreshToken: string) {
  const key = getTokenKeyBuffer();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(refreshToken, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    ciphertext: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
  };
}

export function decryptRefreshToken(record: Pick<GoogleIntegrationRecord, "refresh_token_ciphertext" | "refresh_token_iv" | "refresh_token_tag">) {
  const key = getTokenKeyBuffer();
  const iv = Buffer.from(record.refresh_token_iv, "base64");
  const tag = Buffer.from(record.refresh_token_tag, "base64");
  const encrypted = Buffer.from(record.refresh_token_ciphertext, "base64");

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString("utf8");
}

export async function getGoogleIntegration() {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("google_calendar_integrations")
    .select("*")
    .eq("id", GOOGLE_INTEGRATION_ID)
    .is("revoked_at", null)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as GoogleIntegrationRecord | null;
}

export async function exchangeRefreshTokenForAccessToken(refreshToken: string) {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Missing GOOGLE_OAUTH_CLIENT_ID or GOOGLE_OAUTH_CLIENT_SECRET");
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to refresh Google access token: ${text}`);
  }

  const data = await response.json();
  return data.access_token as string;
}

export async function addAuditLogServer(
  admin: AdminRecord,
  action: string,
  details: string,
  ipAddress?: string,
) {
  const supabase = getSupabaseAdminClient();
  await supabase.from("audit_logs").insert({
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    user_id: admin.id,
    user_email: admin.email,
    user_name: admin.name,
    action,
    details,
    ip_address: ipAddress || null,
    created_at: new Date().toISOString(),
  });
}

export function getClientIp(headers: Record<string, string | undefined>) {
  return headers["x-forwarded-for"]?.split(",")[0]?.trim() || "unknown";
}

export function getBaseUrl() {
  const raw = process.env.URL || process.env.DEPLOY_URL || "";
  if (!raw) return "";

  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  return withProtocol.replace(/\/+$/, "");
}
