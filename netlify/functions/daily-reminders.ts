// Netlify Function for daily email reminders
// Can be triggered manually or scheduled via Netlify UI
// Environment variables needed:
// - RESEND_API_KEY
// - ADMIN_NOTIFICATION_EMAILS (comma-separated)
// - SUPABASE_URL or VITE_SUPABASE_URL
// - SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY

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

interface Contribution {
  id: string;
  member_id: string;
  type: string;
  amount: number;
  due_date: string;
  paid_date?: string;
  status: 'pending' | 'paid' | 'overdue';
}

interface MemberWithContributions extends Member {
  contributions?: Contribution[];
  overdueAmount?: number;
  upcomingAmount?: number;
}

// Helper to get TODAY's birthdays (for sending wishes)
function getTodayBirthdays(members: Member[]): Member[] {
  const today = new Date();
  const todayMonth = today.getMonth();
  const todayDate = today.getDate();

  return members.filter(member => {
    if (!member.date_of_birth) return false;
    const dob = new Date(member.date_of_birth);
    return dob.getMonth() === todayMonth && dob.getDate() === todayDate;
  });
}

// Helper to get upcoming birthdays (for admin reminders)
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
    
    // Exclude today (those get birthday wishes instead)
    if (daysUntil > 0 && daysUntil <= daysAhead) {
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

// Helper to get overdue contributions
function getOverdueContributions(contributions: Contribution[]): Contribution[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return contributions.filter(c => {
    if (c.status === 'paid' || c.paid_date) return false;
    const dueDate = new Date(c.due_date);
    return dueDate < today;
  });
}

// Helper to get upcoming contributions (due in next X days)
function getUpcomingContributions(contributions: Contribution[], daysAhead: number = 7): Contribution[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const futureDate = new Date(today);
  futureDate.setDate(futureDate.getDate() + daysAhead);
  
  return contributions.filter(c => {
    if (c.status === 'paid' || c.paid_date) return false;
    const dueDate = new Date(c.due_date);
    return dueDate >= today && dueDate <= futureDate;
  });
}

// Generate contribution reminder email for a member
function generateContributionReminderEmail(
  memberName: string, 
  upcoming: Contribution[], 
  overdue: Contribution[]
): string {
  const formatAmount = (amount: number) => `${amount.toLocaleString()} RWF`;
  
  let upcomingHtml = '';
  if (upcoming.length > 0) {
    const upcomingItems = upcoming.map(c => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #333;">${c.type}</td>
        <td style="padding: 10px; border-bottom: 1px solid #333; text-align: right;">${formatAmount(c.amount)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #333; text-align: right;">${new Date(c.due_date).toLocaleDateString()}</td>
      </tr>
    `).join('');
    
    upcomingHtml = `
      <div style="margin: 20px 0;">
        <h3 style="color: #d4a537;">📅 Upcoming Contributions</h3>
        <table style="width: 100%; border-collapse: collapse; background: #2a2a2a; border-radius: 8px;">
          <thead>
            <tr style="background: #333;">
              <th style="padding: 10px; text-align: left;">Type</th>
              <th style="padding: 10px; text-align: right;">Amount</th>
              <th style="padding: 10px; text-align: right;">Due Date</th>
            </tr>
          </thead>
          <tbody>${upcomingItems}</tbody>
        </table>
      </div>
    `;
  }
  
  let overdueHtml = '';
  if (overdue.length > 0) {
    const overdueItems = overdue.map(c => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #333;">${c.type}</td>
        <td style="padding: 10px; border-bottom: 1px solid #333; text-align: right; color: #ff6b6b;">${formatAmount(c.amount)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #333; text-align: right; color: #ff6b6b;">${new Date(c.due_date).toLocaleDateString()}</td>
      </tr>
    `).join('');
    
    const totalOverdue = overdue.reduce((sum, c) => sum + c.amount, 0);
    
    overdueHtml = `
      <div style="margin: 20px 0; padding: 15px; background: #4a2020; border-radius: 8px; border-left: 4px solid #ff6b6b;">
        <h3 style="color: #ff6b6b; margin-top: 0;">⚠️ Overdue Contributions</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #3a1515;">
              <th style="padding: 10px; text-align: left;">Type</th>
              <th style="padding: 10px; text-align: right;">Amount</th>
              <th style="padding: 10px; text-align: right;">Was Due</th>
            </tr>
          </thead>
          <tbody>${overdueItems}</tbody>
        </table>
        <p style="margin-top: 15px; font-weight: bold; color: #ff6b6b;">Total Overdue: ${formatAmount(totalOverdue)}</p>
      </div>
    `;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; background-color: #0a0a0a; color: #fff; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #1a1a1a; border-radius: 12px; padding: 30px; }
        h1 { color: #d4a537; margin-bottom: 10px; }
        .footer { margin-top: 30px; text-align: center; color: #888; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>💰 Contribution Reminder</h1>
        <p>Dear ${memberName},</p>
        <p>This is a friendly reminder about your choir contributions:</p>
        ${overdueHtml}
        ${upcomingHtml}
        <p style="margin-top: 20px;">Please make your payments on time to support our choir ministry. Thank you!</p>
        <div class="footer">
          <p>Serenades of Praise Choir</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Generate finance admin summary email
function generateFinanceOverdueEmail(
  overdueByMember: { member: Member; contributions: Contribution[]; total: number }[]
): string {
  const formatAmount = (amount: number) => `${amount.toLocaleString()} RWF`;
  const grandTotal = overdueByMember.reduce((sum, m) => sum + m.total, 0);
  
  const memberRows = overdueByMember.map(({ member, contributions, total }) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #333;">${member.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #333;">${member.email}</td>
      <td style="padding: 10px; border-bottom: 1px solid #333; text-align: center;">${contributions.length}</td>
      <td style="padding: 10px; border-bottom: 1px solid #333; text-align: right; color: #ff6b6b; font-weight: bold;">${formatAmount(total)}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; background-color: #0a0a0a; color: #fff; padding: 20px; }
        .container { max-width: 700px; margin: 0 auto; background: #1a1a1a; border-radius: 12px; padding: 30px; }
        h1 { color: #d4a537; margin-bottom: 10px; }
        .stats { display: flex; gap: 20px; margin: 20px 0; }
        .stat { background: #2a2a2a; padding: 15px; border-radius: 8px; flex: 1; text-align: center; }
        .stat-value { font-size: 24px; font-weight: bold; color: #ff6b6b; }
        .stat-label { font-size: 12px; color: #888; }
        .footer { margin-top: 30px; text-align: center; color: #888; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>📊 Finance Report: Overdue Contributions</h1>
        
        <div class="stats">
          <div class="stat">
            <div class="stat-value">${overdueByMember.length}</div>
            <div class="stat-label">Members with Overdues</div>
          </div>
          <div class="stat">
            <div class="stat-value">${formatAmount(grandTotal)}</div>
            <div class="stat-label">Total Outstanding</div>
          </div>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; background: #2a2a2a; border-radius: 8px; margin-top: 20px;">
          <thead>
            <tr style="background: #333;">
              <th style="padding: 10px; text-align: left;">Member</th>
              <th style="padding: 10px; text-align: left;">Email</th>
              <th style="padding: 10px; text-align: center;">Items</th>
              <th style="padding: 10px; text-align: right;">Total Due</th>
            </tr>
          </thead>
          <tbody>${memberRows}</tbody>
        </table>
        
        <p style="margin-top: 20px; color: #888;">
          Consider following up with these members to collect outstanding contributions.
        </p>
        
        <div class="footer">
          <p>Serenades of Praise Finance System</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Generate birthday reminder email HTML (for admins - upcoming birthdays)
function generateBirthdayReminderEmail(birthdays: Member[]): string {
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

// Generate birthday wish email (sent to ALL members on someone's birthday)
function generateBirthdayWishEmail(birthdayMembers: Member[]): string {
  const names = birthdayMembers.map(m => m.name);
  const nameList = names.length === 1 
    ? names[0] 
    : names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1];
  
  const isPlural = birthdayMembers.length > 1;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; background-color: #0a0a0a; color: #fff; padding: 20px; margin: 0; }
        .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a1a 0%, #2a2020 100%); border-radius: 16px; padding: 40px; text-align: center; }
        .cake { font-size: 80px; margin-bottom: 20px; }
        h1 { color: #d4a537; margin-bottom: 10px; font-size: 28px; }
        .names { color: #fff; font-size: 24px; font-weight: bold; margin: 20px 0; }
        .message { color: #ccc; font-size: 16px; line-height: 1.6; margin: 20px 0; }
        .wish-box { background: #d4a537; color: #000; padding: 15px 30px; border-radius: 8px; display: inline-block; margin: 20px 0; font-weight: bold; }
        .footer { margin-top: 30px; color: #888; font-size: 12px; }
        .confetti { font-size: 24px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="cake">🎂</div>
        <h1>Happy Birthday!</h1>
        <div class="confetti">🎉 🎈 🎊 🎁 🎉</div>
        <div class="names">${nameList}</div>
        <p class="message">
          Today we celebrate ${isPlural ? 'our beloved choir members' : 'our beloved choir member'}!<br><br>
          May God bless you with joy, peace, and many more years of beautiful music. 
          Your voice${isPlural ? 's are' : ' is'} a blessing to our choir family!
        </p>
        <div class="wish-box">
          🎵 Voices United in Celebration 🎵
        </div>
        <p class="message" style="font-style: italic;">
          "This is the day the LORD has made; let us rejoice and be glad in it." - Psalm 118:24
        </p>
        <div class="footer">
          <p>With love from the Serenades of Praise Family ❤️</p>
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
        from: "Serenades of Praise <onboarding@resend.dev>",
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
  try {
    console.log("Running daily reminders check...");

    const envStatus = {
      hasResendKey: !!process.env.RESEND_API_KEY,
      hasAdminEmails: !!process.env.ADMIN_NOTIFICATION_EMAILS,
      hasSupabaseUrl: !!(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL),
      hasSupabaseKey: !!(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY),
    };

    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: "configuration_needed",
          message: "RESEND_API_KEY not configured",
          envStatus 
        }),
      };
    }

    // Get admin emails
    const adminEmails = process.env.ADMIN_NOTIFICATION_EMAILS?.split(',').map(e => e.trim()).filter(Boolean) || [];
    
    if (adminEmails.length === 0) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: "configuration_needed",
          message: "ADMIN_NOTIFICATION_EMAILS not configured",
          envStatus 
        }),
      };
    }

    const results: Record<string, any> = {
      // Birthday wishes (sent to ALL members on the day)
      birthdayWishesSent: false,
      todayBirthdayCount: 0,
      wishRecipients: 0,
      // Birthday reminders (sent to admins for upcoming)
      birthdayRemindersSent: false,
      upcomingBirthdayCount: 0,
      // Event reminders
      eventsSent: false,
      eventCount: 0,
      // Contribution reminders
      contributionRemindersSent: 0,
      overdueRemindersSent: 0,
      financeReportSent: false,
      // Config
      adminEmails: adminEmails.length,
    };

    // Fetch data from Supabase
    const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    let members: Member[] = [];
    let events: Event[] = [];
    let contributions: Contribution[] = [];

    if (SUPABASE_URL && SUPABASE_KEY) {
      // Fetch members
      try {
        const membersRes = await fetch(`${SUPABASE_URL}/rest/v1/members?select=id,name,email,date_of_birth`, {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
          },
        });
        
        if (membersRes.ok) {
          members = await membersRes.json();
          console.log(`Fetched ${members.length} members`);
        }
      } catch (e) {
        console.error("Failed to fetch members:", e);
      }

      // Fetch events
      try {
        const eventsRes = await fetch(`${SUPABASE_URL}/rest/v1/events?select=id,title,date,time,location`, {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
          },
        });
        
        if (eventsRes.ok) {
          events = await eventsRes.json();
          console.log(`Fetched ${events.length} events`);
        }
      } catch (e) {
        console.error("Failed to fetch events:", e);
      }

      // Fetch contributions (unpaid only)
      try {
        const contributionsRes = await fetch(
          `${SUPABASE_URL}/rest/v1/contributions?select=id,member_id,type,amount,due_date,paid_date,status&status=neq.paid`,
          {
            headers: {
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`,
            },
          }
        );
        
        if (contributionsRes.ok) {
          contributions = await contributionsRes.json();
          console.log(`Fetched ${contributions.length} unpaid contributions`);
        }
      } catch (e) {
        console.error("Failed to fetch contributions:", e);
      }
    } else {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: "configuration_needed",
          message: "Supabase not configured",
          envStatus,
          results 
        }),
      };
    }

    // ===== TODAY'S BIRTHDAYS - Send wishes to ALL members =====
    const todayBirthdays = getTodayBirthdays(members);
    
    if (todayBirthdays.length > 0) {
      console.log(`🎂 TODAY's birthdays: ${todayBirthdays.map(m => m.name).join(', ')}`);
      
      // Get all member emails (everyone gets the birthday wish!)
      const allMemberEmails = members.map(m => m.email).filter(Boolean);
      
      if (allMemberEmails.length > 0) {
        const names = todayBirthdays.map(m => m.name);
        const nameList = names.length === 1 
          ? names[0] 
          : names.slice(0, -1).join(', ') + ' & ' + names[names.length - 1];
        
        const sent = await sendEmail(
          allMemberEmails,
          `🎂 Happy Birthday ${nameList}! 🎉`,
          generateBirthdayWishEmail(todayBirthdays)
        );

        if (sent) {
          results.birthdayWishesSent = true;
          results.todayBirthdayCount = todayBirthdays.length;
          results.wishRecipients = allMemberEmails.length;
          console.log(`Birthday wishes sent to ${allMemberEmails.length} members`);
        }
      }
    }

    // ===== UPCOMING BIRTHDAYS - Send reminder to admins =====
    const upcomingBirthdays = getUpcomingBirthdays(members, 7);
    
    if (upcomingBirthdays.length > 0) {
      console.log(`Found ${upcomingBirthdays.length} upcoming birthdays (next 7 days)`);
      
      const sent = await sendEmail(
        adminEmails,
        `🎂 ${upcomingBirthdays.length} Upcoming Birthday${upcomingBirthdays.length > 1 ? 's' : ''} This Week`,
        generateBirthdayReminderEmail(upcomingBirthdays)
      );

      if (sent) {
        results.birthdayRemindersSent = true;
        results.upcomingBirthdayCount = upcomingBirthdays.length;
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
        }
      }
    }

    // ===== CONTRIBUTION REMINDERS =====
    if (contributions.length > 0) {
      const overdue = getOverdueContributions(contributions);
      const upcoming = getUpcomingContributions(contributions, 7);
      
      console.log(`Found ${overdue.length} overdue and ${upcoming.length} upcoming contributions`);

      // Group by member
      const memberContributions = new Map<string, { overdue: Contribution[]; upcoming: Contribution[] }>();
      
      overdue.forEach(c => {
        if (!memberContributions.has(c.member_id)) {
          memberContributions.set(c.member_id, { overdue: [], upcoming: [] });
        }
        memberContributions.get(c.member_id)!.overdue.push(c);
      });
      
      upcoming.forEach(c => {
        if (!memberContributions.has(c.member_id)) {
          memberContributions.set(c.member_id, { overdue: [], upcoming: [] });
        }
        memberContributions.get(c.member_id)!.upcoming.push(c);
      });

      // Send reminders to each member
      for (const [memberId, contribs] of memberContributions) {
        const member = members.find(m => m.id === memberId);
        if (!member || !member.email) continue;

        // Only send if there's something to remind about
        if (contribs.overdue.length > 0 || contribs.upcoming.length > 0) {
          const sent = await sendEmail(
            [member.email],
            contribs.overdue.length > 0 
              ? `⚠️ Contribution Reminder: You have overdue payments`
              : `💰 Contribution Reminder: Upcoming payments due`,
            generateContributionReminderEmail(member.name, contribs.upcoming, contribs.overdue)
          );

          if (sent) {
            if (contribs.overdue.length > 0) {
              results.overdueRemindersSent++;
            } else {
              results.contributionRemindersSent++;
            }
          }
        }
      }

      // Send finance admin summary if there are overdues
      if (overdue.length > 0) {
        const overdueByMember: { member: Member; contributions: Contribution[]; total: number }[] = [];
        
        const memberOverdueMap = new Map<string, Contribution[]>();
        overdue.forEach(c => {
          if (!memberOverdueMap.has(c.member_id)) {
            memberOverdueMap.set(c.member_id, []);
          }
          memberOverdueMap.get(c.member_id)!.push(c);
        });

        for (const [memberId, contribs] of memberOverdueMap) {
          const member = members.find(m => m.id === memberId);
          if (member) {
            overdueByMember.push({
              member,
              contributions: contribs,
              total: contribs.reduce((sum, c) => sum + c.amount, 0),
            });
          }
        }

        // Sort by total overdue (highest first)
        overdueByMember.sort((a, b) => b.total - a.total);

        // Get finance-specific emails (finance officers, reviewers, main admin)
        // Use FINANCE_NOTIFICATION_EMAILS env var, fallback to admin emails
        const financeEmails = process.env.FINANCE_NOTIFICATION_EMAILS?.split(',').map(e => e.trim()).filter(Boolean) 
          || adminEmails;

        const financeEmailsSent = await sendEmail(
          financeEmails,
          `📊 Finance Report: ${overdueByMember.length} Members with Overdue Contributions`,
          generateFinanceOverdueEmail(overdueByMember)
        );

        if (financeEmailsSent) {
          results.financeReportSent = true;
          results.membersWithOverdue = overdueByMember.length;
          results.totalOverdueAmount = overdueByMember.reduce((sum, m) => sum + m.total, 0);
          results.financeRecipients = financeEmails.length;
        }
      }
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "success",
        message: "Daily reminders check completed",
        results,
        data: {
          membersFound: members.length,
          eventsFound: events.length,
          contributionsFound: contributions.length,
          todayBirthdays: todayBirthdays.map(m => m.name),
          upcomingBirthdays: upcomingBirthdays.map(m => m.name),
          tomorrowEvents: tomorrowEvents.map(e => e.title),
          overdueContributions: getOverdueContributions(contributions).length,
          upcomingContributions: getUpcomingContributions(contributions, 7).length,
        },
        timestamp: new Date().toISOString(),
      }),
    };

  } catch (error: any) {
    console.error("Error in daily reminders:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        status: "error",
        error: error.message || "Unknown error" 
      }),
    };
  }
};

export { handler };
