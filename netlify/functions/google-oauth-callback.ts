import type { Handler } from "@netlify/functions";
import {
  ALLOWED_SCOPES,
  GOOGLE_INTEGRATION_ID,
  addAuditLogServer,
  buildHeaders,
  encryptRefreshToken,
  formatGoogleScopeSummary,
  getBaseUrl,
  getSupabaseAdminClient,
  hasRequiredGoogleCalendarScope,
} from "./_shared/googleMeetUtils";

function decodeJwtEmail(idToken?: string): string | null {
  if (!idToken) return null;
  const parts = idToken.split(".");
  if (parts.length < 2) return null;

  try {
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    return typeof payload?.email === "string" ? payload.email : null;
  } catch {
    return null;
  }
}

const handler: Handler = async (event) => {
  const headers = buildHeaders();

  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  const siteUrl = getBaseUrl();
  const redirectTo = (path: string, status: string, message?: string) => {
    const url = new URL(path, siteUrl || "http://localhost:8888");
    url.searchParams.set("googleOAuth", status);
    if (message) url.searchParams.set("message", message);

    return {
      statusCode: 302,
      headers: {
        ...headers,
        Location: url.toString(),
      },
      body: "",
    };
  };

  try {
    const code = event.queryStringParameters?.code;
    const state = event.queryStringParameters?.state;

    if (!code || !state) {
      return redirectTo("/admin", "error", "Missing code/state from Google OAuth callback");
    }

    const supabase = getSupabaseAdminClient();

    const { data: stateRow, error: stateError } = await supabase
      .from("google_oauth_states")
      .select("state, admin_id, redirect_path, expires_at")
      .eq("state", state)
      .single();

    if (stateError || !stateRow) {
      return redirectTo("/admin", "error", "Invalid OAuth state");
    }

    if (new Date(stateRow.expires_at).getTime() < Date.now()) {
      await supabase.from("google_oauth_states").delete().eq("state", state);
      return redirectTo(stateRow.redirect_path || "/admin", "error", "OAuth state expired");
    }

    const { data: admin, error: adminError } = await supabase
      .from("admin_users")
      .select("id, email, name, role, is_active")
      .eq("id", stateRow.admin_id)
      .single();

    if (adminError || !admin || !admin.is_active) {
      await supabase.from("google_oauth_states").delete().eq("state", state);
      return redirectTo(stateRow.redirect_path || "/admin", "error", "Admin no longer active");
    }

    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      throw new Error("Missing GOOGLE_OAUTH_CLIENT_ID or GOOGLE_OAUTH_CLIENT_SECRET");
    }

    if (!siteUrl) {
      throw new Error("Missing URL or DEPLOY_URL environment variable");
    }

    const callbackUrl = `${siteUrl}/.netlify/functions/google-oauth-callback`;
    const tokenBody = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: callbackUrl,
      grant_type: "authorization_code",
    });

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenBody,
    });

    if (!tokenResponse.ok) {
      const tokenText = await tokenResponse.text();
      throw new Error(`Failed to exchange OAuth code: ${tokenText}`);
    }

    const tokenData = await tokenResponse.json();
    const refreshToken = tokenData.refresh_token as string | undefined;
    const accessToken = tokenData.access_token as string | undefined;
    const scope = tokenData.scope as string | undefined;
    const idToken = tokenData.id_token as string | undefined;

    if (!refreshToken || !accessToken) {
      throw new Error("Google did not return a refresh token. Re-consent with prompt=consent.");
    }

    if (!hasRequiredGoogleCalendarScope(scope)) {
      throw new Error(
        `Google did not grant calendar access. Returned scopes: ${formatGoogleScopeSummary(scope)}. Reconnect and approve Google Calendar permissions.`,
      );
    }

    let googleEmail: string | null = null;
    try {
      const profileResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (profileResponse.ok) {
        const profile = await profileResponse.json();
        googleEmail = (profile.email as string | undefined) || null;
      }
    } catch {
      // noop
    }

    if (!googleEmail) {
      googleEmail = decodeJwtEmail(idToken);
    }

    if (!googleEmail) {
      throw new Error("Unable to determine the connected Google account email. Please reconnect and approve all requested permissions.");
    }

    const encrypted = encryptRefreshToken(refreshToken);

    await supabase.from("google_calendar_integrations").upsert(
      {
        id: GOOGLE_INTEGRATION_ID,
        google_email: googleEmail,
        calendar_id: "primary",
        refresh_token_ciphertext: encrypted.ciphertext,
        refresh_token_iv: encrypted.iv,
        refresh_token_tag: encrypted.tag,
        scope: scope || ALLOWED_SCOPES.join(" "),
        connected_by_admin_id: admin.id,
        connected_at: new Date().toISOString(),
        revoked_at: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );

    await supabase.from("google_oauth_states").delete().eq("state", state);

    await addAuditLogServer(
      admin,
      "GOOGLE_CALENDAR_CONNECTED",
      `Connected Google Calendar integration (${googleEmail}) with scope: ${formatGoogleScopeSummary(scope || ALLOWED_SCOPES.join(" "))}`,
    );

    return redirectTo(stateRow.redirect_path || "/admin", "success", "Google Calendar connected");
  } catch (error: any) {
    return redirectTo("/admin", "error", error.message || "Google OAuth callback failed");
  }
};

export { handler };
