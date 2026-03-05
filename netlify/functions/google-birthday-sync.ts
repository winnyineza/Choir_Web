import type { Handler } from "@netlify/functions";
import {
  addAuditLogServer,
  buildHeaders,
  decryptRefreshToken,
  exchangeRefreshTokenForAccessToken,
  getClientIp,
  getGoogleIntegration,
  normalizeGoogleCalendarId,
  getSupabaseAdminClient,
  requireActiveAdmin,
} from "./_shared/googleMeetUtils";

type MemberRow = {
  id: string;
  name: string;
  status: string;
  date_of_birth: string | null;
};

type GoogleCalendarEvent = {
  id: string;
  summary?: string;
  extendedProperties?: {
    private?: {
      serenadesType?: string;
      memberId?: string;
    };
  };
};

const BIRTHDAY_TYPE = "member_birthday";

function toMonthDay(dateOfBirth: string) {
  const [, rawMonth, rawDay] = dateOfBirth.split("-").map(Number);
  const month = String(rawMonth).padStart(2, "0");
  const day = String(rawDay).padStart(2, "0");
  return { month, day };
}

function getAllDayEndDate(startDate: string) {
  const [year, month, day] = startDate.split("-").map(Number);
  const endDate = new Date(year, month - 1, day + 1);
  const yyyy = String(endDate.getFullYear());
  const mm = String(endDate.getMonth() + 1).padStart(2, "0");
  const dd = String(endDate.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function buildBirthdayEventPayload(member: MemberRow) {
  const firstName = member.name.split(" ")[0];
  const possessiveName = firstName.endsWith("s") ? `${firstName}'` : `${firstName}'s`;
  const { month, day } = toMonthDay(member.date_of_birth!);
  const startDate = `2000-${month}-${day}`;

  return {
    summary: `${possessiveName} Birthday`,
    description: `🎂 Auto-synced recurring birthday for ${member.name}.`,
    start: { date: startDate },
    end: { date: getAllDayEndDate(startDate) },
    recurrence: ["RRULE:FREQ=YEARLY"],
    transparency: "transparent",
    reminders: { useDefault: true },
    extendedProperties: {
      private: {
        serenadesType: BIRTHDAY_TYPE,
        memberId: member.id,
      },
    },
  };
}

async function googleRequest(accessToken: string, url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Google Calendar API error: ${text}`);
  }

  return response;
}

function getGoogleErrorCodeFromMessage(message: string): number | null {
  const codeMatch = message.match(/"code"\s*:\s*(\d+)/);
  return codeMatch ? Number(codeMatch[1]) : null;
}

const handler: Handler = async (event) => {
  const headers = buildHeaders();

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const admin = await requireActiveAdmin(event.headers);
    const integration = await getGoogleIntegration();

    if (!integration) {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({ error: "Google Calendar is not connected" }),
      };
    }

    const rawCalendarId = process.env.GOOGLE_TARGET_CALENDAR_ID || integration.calendar_id;
    const calendarId = normalizeGoogleCalendarId(rawCalendarId);
    if (!calendarId) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Missing Google target calendar id" }),
      };
    }

    const refreshToken = decryptRefreshToken(integration);
    const accessToken = await exchangeRefreshTokenForAccessToken(refreshToken);
    const supabase = getSupabaseAdminClient();

    const { data: members, error: membersError } = await supabase
      .from("members")
      .select("id,name,status,date_of_birth")
      .eq("status", "Active")
      .not("date_of_birth", "is", null);

    if (membersError) {
      throw new Error(membersError.message);
    }

    const activeMembers = (members || []).filter((member: MemberRow) => Boolean(member.date_of_birth));
    const activeById = new Map(activeMembers.map((member: MemberRow) => [member.id, member]));

    let listData: any;
    try {
      const listUrl = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`);
      listUrl.searchParams.set("singleEvents", "false");
      listUrl.searchParams.set("showDeleted", "false");
      listUrl.searchParams.set("maxResults", "2500");
      listUrl.searchParams.set("privateExtendedProperty", `serenadesType=${BIRTHDAY_TYPE}`);

      const listRes = await googleRequest(accessToken, listUrl.toString());
      listData = await listRes.json();
    } catch (error: any) {
      const message = String(error?.message || "");
      const googleCode = getGoogleErrorCodeFromMessage(message);
      if (googleCode === 404) {
        throw new Error(`Google calendar not found: ${calendarId}`);
      }
      throw error;
    }

    const existingEvents = (listData.items || []) as GoogleCalendarEvent[];

    const existingByMemberId = new Map<string, GoogleCalendarEvent>();
    const orphanedEvents: GoogleCalendarEvent[] = [];

    for (const eventItem of existingEvents) {
      const memberId = eventItem.extendedProperties?.private?.memberId;
      if (!memberId) {
        orphanedEvents.push(eventItem);
        continue;
      }

      if (!existingByMemberId.has(memberId)) {
        existingByMemberId.set(memberId, eventItem);
      } else {
        orphanedEvents.push(eventItem);
      }
    }

    let created = 0;
    let updated = 0;
    let deleted = 0;

    for (const member of activeMembers) {
      const payload = buildBirthdayEventPayload(member);
      const existing = existingByMemberId.get(member.id);

      if (existing) {
        const patchUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(existing.id)}?sendUpdates=none`;
        await googleRequest(accessToken, patchUrl, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        updated += 1;
      } else {
        const createUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?sendUpdates=none`;
        await googleRequest(accessToken, createUrl, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        created += 1;
      }
    }

    for (const [memberId, existingEvent] of existingByMemberId.entries()) {
      if (activeById.has(memberId)) continue;
      orphanedEvents.push(existingEvent);
    }

    for (const orphan of orphanedEvents) {
      const deleteUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(orphan.id)}?sendUpdates=none`;
      await googleRequest(accessToken, deleteUrl, { method: "DELETE" });
      deleted += 1;
    }

    await addAuditLogServer(
      admin,
      "GOOGLE_BIRTHDAY_SYNC",
      `Synced birthdays to Google Calendar (created: ${created}, updated: ${updated}, deleted: ${deleted})`,
      getClientIp(event.headers),
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        created,
        updated,
        deleted,
        totalActiveBirthdays: activeMembers.length,
        calendarId,
      }),
    };
  } catch (error: any) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: error.message || "Failed to sync Google birthday events" }),
    };
  }
};

export { handler };
