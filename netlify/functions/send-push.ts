import type { Handler } from "@netlify/functions";
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ""
);

// Configure VAPID
webpush.setVapidDetails(
  "mailto:" + (process.env.GMAIL_USER || "noreply@serenadesofpraise.com"),
  process.env.VAPID_PUBLIC_KEY || "",
  process.env.VAPID_PRIVATE_KEY || ""
);

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  data?: Record<string, unknown>;
  userId?: string; // Send to specific user, or all if omitted
}

const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  // Basic auth check
  const authHeader = event.headers["authorization"];
  const expectedKey = process.env.PUSH_API_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!authHeader || authHeader !== `Bearer ${expectedKey}`) {
    return { statusCode: 401, body: "Unauthorized" };
  }

  try {
    const payload: PushPayload = JSON.parse(event.body || "{}");

    if (!payload.title || !payload.body) {
      return { statusCode: 400, body: "title and body are required" };
    }

    // Fetch subscriptions
    let query = supabase.from("push_subscriptions").select("*");
    if (payload.userId) {
      query = query.eq("user_id", payload.userId);
    }
    const { data: subscriptions, error } = await query;

    if (error || !subscriptions?.length) {
      return {
        statusCode: 200,
        body: JSON.stringify({ sent: 0, message: "No subscriptions found" }),
      };
    }

    const pushPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || "/icon-192x192.png",
      tag: payload.tag || "sop-notification",
      data: payload.data || { url: "/" },
    });

    let sent = 0;
    let failed = 0;
    const staleEndpoints: string[] = [];

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          pushPayload
        );
        sent++;
      } catch (err: any) {
        failed++;
        // Remove expired/invalid subscriptions (410 Gone or 404)
        if (err.statusCode === 410 || err.statusCode === 404) {
          staleEndpoints.push(sub.endpoint);
        }
      }
    }

    // Clean up stale subscriptions
    if (staleEndpoints.length > 0) {
      await supabase
        .from("push_subscriptions")
        .delete()
        .in("endpoint", staleEndpoints);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        sent,
        failed,
        cleaned: staleEndpoints.length,
        total: subscriptions.length,
      }),
    };
  } catch (err) {
    console.error("Push send error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to send push notifications" }),
    };
  }
};

export { handler };
