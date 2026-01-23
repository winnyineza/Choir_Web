// Netlify Scheduled Function for daily email reminders
// Schedule: Runs daily at 6 AM UTC (8 AM Rwanda time)
// Configure in netlify.toml or via Netlify UI

import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

interface Member {
  id: string;
  name: string;
  email: string;
  date_of_birth?: string;
}

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location?: string;
}

// Helper to get upcoming birthdays
function getUpcomingBirthdays(members: Member[], daysAhead: number = 7): Member[] {
  const today = new Date();
  const upcoming: Member[] = [];

  members.forEach(member => {
    if (!member.date_of_birth) return;
    
    const dob = new Date(member.date_of_birth);
    const thisYearBirthday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
    
    if (thisYearBirthday < today) {
      thisYearBirthday.setFullYear(today.getFullYear() + 1);
    }
    
    const daysUntil = Math.ceil((thisYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntil >= 0 && daysUntil <= daysAhead) {
      upcoming.push(member);
    }
  });

  return upcoming;
}

// Helper to get tomorrow's events
function getTomorrowEvents(events: Event[]): Event[] {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  return events.filter(event => {
    const eventDate = new Date(event.date).toISOString().split('T')[0];
    return eventDate === tomorrowStr;
  });
}

// Generate birthday reminder email HTML
function generateBirthdayEmail(birthdays: Member[]): string {
  const birthdayList = birthdays.map(m => {
    const dob = new Date(m.date_of_birth!);
    return `<li><strong>${m.name}</strong> - ${dob.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</li>`;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; background-color: #0a0a0a; color: #fff; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #1a1a1a; border-radius: 12px; padding: 30px; }
        h1 { color: #d4a537; margin-bottom: 20px; }
        ul { list-style: none; padding: 0; }
        li { padding: 10px 15px; background: #2a2a2a; margin-bottom: 8px; border-radius: 8px; border-left: 4px solid #d4a537; }
        .footer { margin-top: 30px; text-align: center; color: #888; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🎂 Upcoming Birthdays!</h1>
        <p>The following choir members have birthdays coming up in the next 7 days:</p>
        <ul>${birthdayList}</ul>
        <p>Don't forget to wish them a happy birthday!</p>
        <div class="footer">
          <p>Serenades of Praise Choir Management System</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Generate event reminder email HTML
function generateEventReminderEmail(events: Event[]): string {
  const eventList = events.map(e => `
    <div style="padding: 15px; background: #2a2a2a; margin-bottom: 10px; border-radius: 8px; border-left: 4px solid #d4a537;">
      <strong style="color: #d4a537; font-size: 16px;">${e.title}</strong><br>
      <span style="color: #aaa;">📅 ${new Date(e.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span><br>
      <span style="color: #aaa;">⏰ ${e.time}</span><br>
      ${e.location ? `<span style="color: #aaa;">📍 ${e.location}</span>` : ''}
    </div>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; background-color: #0a0a0a; color: #fff; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #1a1a1a; border-radius: 12px; padding: 30px; }
        h1 { color: #d4a537; margin-bottom: 20px; }
        .footer { margin-top: 30px; text-align: center; color: #888; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>📅 Event Reminder - Tomorrow!</h1>
        <p>Don't forget! The following events are happening tomorrow:</p>
        ${eventList}
        <p style="margin-top: 20px;">Please make sure you're prepared and arrive on time!</p>
        <div class="footer">
          <p>Serenades of Praise Choir Management System</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Send email via Resend API
async function sendEmail(to: string[], subject: string, html: string): Promise<boolean> {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  
  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY not configured");
    return false;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Serenades of Praise <noreply@theserenades.com>",
        to: to,
        subject: subject,
        html: html,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Resend API error:", errorData);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Wrap everything in try-catch to prevent crashes
  try {
    console.log("Running daily reminders check...");

    // Return early with status info if this is just a test/health check
    const envStatus = {
      hasResendKey: !!process.env.RESEND_API_KEY,
      hasAdminEmails: !!process.env.ADMIN_NOTIFICATION_EMAILS,
      hasSupabaseUrl: !!(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL),
      hasSupabaseKey: !!(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY),
    };

    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.log("RESEND_API_KEY not configured");
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: "configuration_needed",
          message: "RESEND_API_KEY not configured in Netlify environment variables",
          envStatus 
        }),
      };
    }

  // Get admin email from environment (comma-separated list)
  const adminEmails = process.env.ADMIN_NOTIFICATION_EMAILS?.split(',').map(e => e.trim()).filter(Boolean) || [];
  
  if (adminEmails.length === 0) {
    console.log("No admin notification emails configured.");
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "No admin emails configured. Add ADMIN_NOTIFICATION_EMAILS env variable." }),
    };
  }

  const results = {
    birthdaysSent: false,
    eventsSent: false,
    birthdayCount: 0,
    eventCount: 0,
    adminEmails: adminEmails.length,
  };

  try {
    // Fetch data from Supabase
    const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    let members: Member[] = [];
    let events: Event[] = [];

    if (SUPABASE_URL && SUPABASE_KEY) {
      // Fetch members
      const membersRes = await fetch(`${SUPABASE_URL}/rest/v1/members?select=id,name,email,date_of_birth`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
      });
      
      if (membersRes.ok) {
        members = await membersRes.json();
        console.log(`Fetched ${members.length} members`);
      } else {
        console.error("Failed to fetch members:", await membersRes.text());
      }

      // Fetch events
      const eventsRes = await fetch(`${SUPABASE_URL}/rest/v1/events?select=id,title,date,time,location`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
      });
      
      if (eventsRes.ok) {
        events = await eventsRes.json();
        console.log(`Fetched ${events.length} events`);
      } else {
        console.error("Failed to fetch events:", await eventsRes.text());
      }
    } else {
      console.log("Supabase not configured. No data to check.");
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          message: "Supabase not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
          results 
        }),
      };
    }

    // Check for upcoming birthdays
    const upcomingBirthdays = getUpcomingBirthdays(members, 7);
    
    if (upcomingBirthdays.length > 0) {
      console.log(`Found ${upcomingBirthdays.length} upcoming birthdays`);
      
      const sent = await sendEmail(
        adminEmails,
        `🎂 ${upcomingBirthdays.length} Upcoming Birthday${upcomingBirthdays.length > 1 ? 's' : ''} This Week`,
        generateBirthdayEmail(upcomingBirthdays)
      );

      if (sent) {
        results.birthdaysSent = true;
        results.birthdayCount = upcomingBirthdays.length;
        console.log("Birthday reminder sent successfully");
      }
    }

    // Check for tomorrow's events
    const tomorrowEvents = getTomorrowEvents(events);
    
    if (tomorrowEvents.length > 0) {
      console.log(`Found ${tomorrowEvents.length} events tomorrow`);

      const sent = await sendEmail(
        adminEmails,
        `📅 Reminder: ${tomorrowEvents.length} Event${tomorrowEvents.length > 1 ? 's' : ''} Tomorrow`,
        generateEventReminderEmail(tomorrowEvents)
      );

      if (sent) {
        results.eventsSent = true;
        results.eventCount = tomorrowEvents.length;
        console.log("Event reminder sent successfully");
      }

      // Optionally send to all members
      if (process.env.SEND_MEMBER_REMINDERS === 'true') {
        const memberEmails = members.map(m => m.email).filter(Boolean);
        if (memberEmails.length > 0) {
          await sendEmail(
            memberEmails,
            `📅 Reminder: ${tomorrowEvents[0].title} Tomorrow`,
            generateEventReminderEmail(tomorrowEvents)
          );
          console.log(`Event reminder sent to ${memberEmails.length} members`);
        }
      }
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Daily reminders check completed",
        results,
        timestamp: new Date().toISOString(),
      }),
    };

  } catch (error: any) {
    console.error("Error in daily reminders:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: error.message || "Unknown error", stack: error.stack }),
    };
  }
  } catch (globalError: any) {
    // Global catch for any uncaught errors
    console.error("Uncaught error in daily-reminders:", globalError);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        error: "Internal function error", 
        message: globalError.message || "Unknown error",
      }),
    };
  }
};

export { handler };

// Note: To enable scheduled execution, configure in netlify.toml:
// [functions."daily-reminders"]
// schedule = "0 6 * * *"
