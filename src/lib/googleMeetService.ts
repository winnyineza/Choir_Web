export interface GoogleConnectionStatus {
  connected: boolean;
  googleEmail: string | null;
  connectedAt: string | null;
}

export interface GoogleMeetingPayload {
  meetingId?: string;
  googleEventId?: string;
  title: string;
  description?: string;
  location?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  timezone?: string;
  includeMeetLink?: boolean;
}

export interface GoogleMeetingResult {
  success: boolean;
  googleEventId: string;
  googleMeetLink: string | null;
  googleEventLink: string | null;
  googleConferenceId: string | null;
}

async function readJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) return {} as T;
  return JSON.parse(text) as T;
}

function createHeaders(adminId: string) {
  return {
    "Content-Type": "application/json",
    "X-Admin-Id": adminId,
  };
}

export async function getGoogleConnectionStatus(adminId: string): Promise<GoogleConnectionStatus> {
  const response = await fetch("/.netlify/functions/google-meetings", {
    method: "GET",
    headers: createHeaders(adminId),
  });

  const data = await readJson<any>(response);
  if (!response.ok) {
    throw new Error(data.error || "Failed to fetch Google connection status");
  }

  return {
    connected: Boolean(data.connected),
    googleEmail: data.googleEmail || null,
    connectedAt: data.connectedAt || null,
  };
}

export async function getGoogleOAuthStartUrl(adminId: string, redirectPath = "/admin"): Promise<string> {
  const params = new URLSearchParams({ redirectPath });
  const response = await fetch(`/.netlify/functions/google-oauth-start?${params.toString()}`, {
    method: "GET",
    headers: { "X-Admin-Id": adminId },
  });

  const data = await readJson<any>(response);
  if (!response.ok || !data.authUrl) {
    throw new Error(data.error || "Failed to start Google OAuth flow");
  }

  return data.authUrl as string;
}

export async function createOrUpdateGoogleMeeting(
  adminId: string,
  payload: GoogleMeetingPayload,
): Promise<GoogleMeetingResult> {
  const method = payload.googleEventId ? "PATCH" : "POST";
  const response = await fetch("/.netlify/functions/google-meetings", {
    method,
    headers: createHeaders(adminId),
    body: JSON.stringify(payload),
  });

  const data = await readJson<any>(response);
  if (!response.ok) {
    throw new Error(data.error || "Failed to sync Google meeting");
  }

  return data as GoogleMeetingResult;
}

export async function deleteGoogleMeeting(adminId: string, meetingId: string, googleEventId: string): Promise<void> {
  const response = await fetch("/.netlify/functions/google-meetings", {
    method: "DELETE",
    headers: createHeaders(adminId),
    body: JSON.stringify({ meetingId, googleEventId }),
  });

  const data = await readJson<any>(response);
  if (!response.ok) {
    throw new Error(data.error || "Failed to delete Google meeting");
  }
}
