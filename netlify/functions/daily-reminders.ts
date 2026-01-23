import { Handler, schedule } from "@netlify/functions";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// This function runs daily at 8 AM UTC (adjust as needed)
// Cron: "0 8 * * *" = At 08:00 every day

interface Member {
  id: string;
  name: string;
  email: string;
  dateOfBirth?: string;
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
    if (!member.dateOfBirth) return;
    
    const dob = new Date(member.dateOfBirth);
    const thisYearBirthday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
    
    // If birthday already passed this year, check next year
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
    const dob = new Date(m.dateOfBirth!);
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

// Main handler
const handler: Handler = async (event, context) => {
  console.log("Running daily reminders check...");

  // Check if Resend API key is configured
  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY not configured");
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Email service not configured" }),
    };
  }

  // Get admin email from environment (comma-separated list)
  const adminEmails = process.env.ADMIN_NOTIFICATION_EMAILS?.split(',').map(e => e.trim()) || [];
  
  if (adminEmails.length === 0) {
    console.log("No admin notification emails configured. Skipping.");
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "No admin emails configured" }),
    };
  }

  try {
    // In a real setup, you'd fetch this from Supabase
    // For now, we'll use environment variables or Supabase client
    const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    let members: Member[] = [];
    let events: Event[] = [];

    if (SUPABASE_URL && SUPABASE_KEY) {
      // Fetch from Supabase
      const membersRes = await fetch(`${SUPABASE_URL}/rest/v1/members?select=id,name,email,date_of_birth`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
      });
      
      if (membersRes.ok) {
        const data = await membersRes.json();
        members = data.map((m: any) => ({
          id: m.id,
          name: m.name,
          email: m.email,
          dateOfBirth: m.date_of_birth,
        }));
      }

      const eventsRes = await fetch(`${SUPABASE_URL}/rest/v1/events?select=id,title,date,time,location`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
      });
      
      if (eventsRes.ok) {
        events = await eventsRes.json();
      }
    }

    const results = {
      birthdaysSent: false,
      eventsSent: false,
      birthdayCount: 0,
      eventCount: 0,
    };

    // Check for upcoming birthdays
    const upcomingBirthdays = getUpcomingBirthdays(members, 7);
    
    if (upcomingBirthdays.length > 0) {
      console.log(`Found ${upcomingBirthdays.length} upcoming birthdays`);
      
      const { error } = await resend.emails.send({
        from: "Choir App <onboarding@resend.dev>",
        to: adminEmails,
        subject: `🎂 ${upcomingBirthdays.length} Upcoming Birthday${upcomingBirthdays.length > 1 ? 's' : ''} This Week`,
        html: generateBirthdayEmail(upcomingBirthdays),
      });

      if (error) {
        console.error("Error sending birthday reminder:", error);
      } else {
        results.birthdaysSent = true;
        results.birthdayCount = upcomingBirthdays.length;
        console.log("Birthday reminder sent successfully");
      }
    }

    // Check for tomorrow's events
    const tomorrowEvents = getTomorrowEvents(events);
    
    if (tomorrowEvents.length > 0) {
      console.log(`Found ${tomorrowEvents.length} events tomorrow`);

      // Send to admins
      const { error: adminError } = await resend.emails.send({
        from: "Choir App <onboarding@resend.dev>",
        to: adminEmails,
        subject: `📅 Reminder: ${tomorrowEvents.length} Event${tomorrowEvents.length > 1 ? 's' : ''} Tomorrow`,
        html: generateEventReminderEmail(tomorrowEvents),
      });

      if (adminError) {
        console.error("Error sending event reminder to admins:", adminError);
      } else {
        results.eventsSent = true;
        results.eventCount = tomorrowEvents.length;
        console.log("Event reminder sent to admins successfully");
      }

      // Optionally, send to all members
      const memberEmails = members.map(m => m.email).filter(Boolean);
      if (memberEmails.length > 0 && process.env.SEND_MEMBER_REMINDERS === 'true') {
        const { error: memberError } = await resend.emails.send({
          from: "Choir App <onboarding@resend.dev>",
          to: memberEmails,
          subject: `📅 Reminder: ${tomorrowEvents[0].title} Tomorrow`,
          html: generateEventReminderEmail(tomorrowEvents),
        });

        if (memberError) {
          console.error("Error sending event reminder to members:", memberError);
        } else {
          console.log(`Event reminder sent to ${memberEmails.length} members`);
        }
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Daily reminders check completed",
        results,
        timestamp: new Date().toISOString(),
      }),
    };

  } catch (error) {
    console.error("Error in daily reminders:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
    };
  }
};

// Schedule: Run every day at 8:00 AM UTC
// Adjust the time for your timezone (e.g., "0 6 * * *" for 6 AM UTC = 8 AM CAT)
export const scheduledHandler = schedule("0 6 * * *", handler);

// Also export for manual testing
export { handler };
