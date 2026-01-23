// Minimal test version to debug
import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  try {
    // Just return env status for debugging
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Function is working!",
        envStatus: {
          hasResendKey: !!process.env.RESEND_API_KEY,
          hasAdminEmails: !!process.env.ADMIN_NOTIFICATION_EMAILS,
          hasSupabaseUrl: !!(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL),
          nodeVersion: process.version,
        },
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: error.message }),
    };
  }
};

export { handler };
