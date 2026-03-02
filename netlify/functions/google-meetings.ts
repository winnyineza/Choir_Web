import type { Handler } from "@netlify/functions";
import {
  addAuditLogServer,
  buildHeaders,
  decryptRefreshToken,
  exchangeRefreshTokenForAccessToken,
  getClientIp,
  getGoogleIntegration,
  getSupabaseAdminClient,
  requireActiveAdmin,
} from "./_shared/googleMeetUtils";

type GoogleMeetingPayload = {
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
  attendeeEmails?: string[];
};

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function parseIsoDate(date: string, time?: string) {
  if (time) return new Date(`${date}T${time}:00`);
  return new Date(`${date}T00:00:00`);
}

function buildEventDateTimes(payload: GoogleMeetingPayload) {
  const start = parseIsoDate(payload.date, payload.startTime || "09:00");
  const end = payload.endTime
    ? parseIsoDate(payload.date, payload.endTime)
    : new Date(start.getTime() + 60 * 60 * 1000);

  return {
    start: {
      dateTime: start.toISOString(),
      timeZone: payload.timezone || "Africa/Lagos",
    },
    end: {
      dateTime: end.toISOString(),
      timeZone: payload.timezone || "Africa/Lagos",
    },
  };
}

function extractMeetLink(eventData: any): string {
  if (eventData?.hangoutLink) return eventData.hangoutLink;

  const entryPoints = eventData?.conferenceData?.entryPoints || [];
  const video = entryPoints.find((entry: any) => entry?.entryPointType === "video");
  return video?.uri || "";
}

const handler: Handler = async (event) => {
  const headers = buildHeaders();

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  const rateLimitKey = getClientIp(event.headers);
  const now = Date.now();
  const entry = rateLimitMap.get(rateLimitKey);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(rateLimitKey, { count: 1, resetAt: now + 15 * 60 * 1000 });
  } else {
    entry.count += 1;
    if (entry.count > 200) {
      return {
        statusCode: 429,
        headers,
        body: JSON.stringify({ error: "Too many requests. Try again later." }),
      };
    }
  }

  try {
    const admin = await requireActiveAdmin(event.headers);
    const integration = await getGoogleIntegration();

    if (event.httpMethod === "GET") {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          connected: Boolean(integration),
          googleEmail: integration?.google_email || null,
          connectedAt: integration?.connected_at || null,
        }),
      };
    }

    if (!integration) {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({ error: "Google Calendar is not connected" }),
      };
    }

    const refreshToken = decryptRefreshToken(integration);
    const accessToken = await exchangeRefreshTokenForAccessToken(refreshToken);
    const calendarId = process.env.GOOGLE_TARGET_CALENDAR_ID || integration.calendar_id || "primary";
    const supabase = getSupabaseAdminClient();
    const clientIp = getClientIp(event.headers);

    if (event.httpMethod === "DELETE") {
      const parsedBody = event.body ? JSON.parse(event.body) : {};
      const googleEventId = parsedBody.googleEventId as string | undefined;
      const meetingId = parsedBody.meetingId as string | undefined;

      if (!googleEventId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "Missing googleEventId" }),
        };
      }

      const eventUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(googleEventId)}`;

      // Step 1: Explicitly cancel event first so invitees receive cancellation updates.
      const cancelRes = await fetch(`${eventUrl}?sendUpdates=all&sendNotifications=true`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "cancelled" }),
      });

      if (!cancelRes.ok && cancelRes.status !== 404 && cancelRes.status !== 410) {
        const text = await cancelRes.text();
        throw new Error(`Failed to cancel Google event before delete: ${text}`);
      }

      // Step 2: Delete from organizer calendar to keep data clean.
      const deleteRes = await fetch(`${eventUrl}?sendUpdates=all&sendNotifications=true`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!deleteRes.ok && deleteRes.status !== 410 && deleteRes.status !== 404) {
        const text = await deleteRes.text();
        throw new Error(`Failed to delete Google event: ${text}`);
      }

      if (meetingId) {
        await supabase
          .from("meeting_minutes")
          .update({
            google_event_id: null,
            google_meet_link: null,
            google_event_link: null,
            google_conference_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", meetingId);
      }

      await addAuditLogServer(admin, "GOOGLE_MEETING_DELETE", `Deleted Google meeting event ${googleEventId}`, clientIp);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true }),
      };
    }

    if (event.httpMethod !== "POST" && event.httpMethod !== "PATCH") {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: "Method not allowed" }),
      };
    }

    const payload = (event.body ? JSON.parse(event.body) : {}) as GoogleMeetingPayload;
    if (!payload.title || !payload.date) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "title and date are required" }),
      };
    }

    const dateTimes = buildEventDateTimes(payload);
    const baseEvent = {
      summary: payload.title,
      description: payload.description || "",
      location: payload.location || "",
      start: dateTimes.start,
      end: dateTimes.end,
      attendees: Array.from(new Set((payload.attendeeEmails || [])
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean),
      )).map((email) => ({ email })),
    };
    const includeMeetLink = payload.includeMeetLink !== false;

    let response: Response;
    const conferenceRequest = {
      createRequest: {
        requestId: `meet-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    };

    if (event.httpMethod === "PATCH" && payload.googleEventId) {
      const query = includeMeetLink ? "conferenceDataVersion=1&sendUpdates=all" : "sendUpdates=all";
      response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(payload.googleEventId)}?${query}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...baseEvent,
            ...(includeMeetLink ? { conferenceData: conferenceRequest } : { conferenceData: null }),
          }),
        },
      );
    } else {
      const query = includeMeetLink ? "conferenceDataVersion=1&sendUpdates=all" : "sendUpdates=all";
      response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${query}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...baseEvent,
            ...(includeMeetLink ? { conferenceData: conferenceRequest } : {}),
          }),
        },
      );
    }

    if (!response.ok) {
      const text = await response.text();
      if (text.includes("invalid_grant")) {
        await supabase
          .from("google_calendar_integrations")
          .update({ revoked_at: new Date().toISOString(), updated_at: new Date().toISOString() })
          .eq("id", integration.id);
      }
      throw new Error(`Google Calendar API error: ${text}`);
    }

    const eventData = await response.json();
    const meetLink = extractMeetLink(eventData);
    const conferenceId = includeMeetLink ? eventData.conferenceData?.conferenceId || null : null;
    const meetLinkValue = includeMeetLink ? meetLink || null : null;

    if (payload.meetingId) {
      await supabase
        .from("meeting_minutes")
        .update({
          google_event_id: eventData.id || null,
          google_meet_link: meetLinkValue,
          google_event_link: eventData.htmlLink || null,
          google_conference_id: conferenceId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", payload.meetingId);
    }

    const action = event.httpMethod === "PATCH" && payload.googleEventId ? "GOOGLE_MEETING_UPDATE" : "GOOGLE_MEETING_CREATE";
    await addAuditLogServer(admin, action, `Synced Google meeting event ${eventData.id}`, clientIp);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        googleEventId: eventData.id,
        googleMeetLink: meetLinkValue,
        googleEventLink: eventData.htmlLink || null,
        googleConferenceId: conferenceId,
      }),
    };
  } catch (error: any) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: error.message || "Google meeting request failed" }),
    };
  }
};

export { handler };
