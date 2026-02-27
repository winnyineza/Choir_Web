import type { Handler } from "@netlify/functions";
import crypto from "crypto";
import {
  ALLOWED_SCOPES,
  addAuditLogServer,
  buildHeaders,
  getBaseUrl,
  getClientIp,
  getSupabaseAdminClient,
  requireActiveAdmin,
} from "./_shared/googleMeetUtils";

const handler: Handler = async (event) => {
  const headers = buildHeaders();

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const admin = await requireActiveAdmin(event.headers);
    const supabase = getSupabaseAdminClient();
    const clientIp = getClientIp(event.headers);

    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
    if (!clientId) {
      throw new Error("Missing GOOGLE_OAUTH_CLIENT_ID");
    }

    const siteUrl = getBaseUrl();
    if (!siteUrl) {
      throw new Error("Missing URL or DEPLOY_URL environment variable");
    }

    const callbackUrl = `${siteUrl}/.netlify/functions/google-oauth-callback`;
    const redirectPath = event.queryStringParameters?.redirectPath || "/admin";
    const state = crypto.randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await supabase.from("google_oauth_states").insert({
      state,
      admin_id: admin.id,
      redirect_path: redirectPath,
      created_ip: clientIp,
      expires_at: expiresAt,
      created_at: new Date().toISOString(),
    });

    const authParams = new URLSearchParams({
      client_id: clientId,
      redirect_uri: callbackUrl,
      response_type: "code",
      access_type: "offline",
      prompt: "consent",
      include_granted_scopes: "true",
      scope: ALLOWED_SCOPES.join(" "),
      state,
    });

    await addAuditLogServer(
      admin,
      "GOOGLE_CALENDAR_OAUTH_START",
      "Started Google Calendar integration OAuth consent flow",
      clientIp,
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ authUrl: `https://accounts.google.com/o/oauth2/v2/auth?${authParams.toString()}` }),
    };
  } catch (error: any) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: error.message || "Failed to start OAuth flow" }),
    };
  }
};

export { handler };
