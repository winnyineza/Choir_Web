// Netlify Function for daily email reminders
// Can be triggered manually or scheduled via Netlify UI
// Environment variables needed:
// - GMAIL_USER
// - GMAIL_APP_PASSWORD
// - ADMIN_NOTIFICATION_EMAILS (comma-separated)
// - FINANCE_NOTIFICATION_EMAILS (comma-separated, for finance/contribution summary emails)
// - SUPABASE_URL or VITE_SUPABASE_URL
// - SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY

import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import nodemailer from "nodemailer";

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

// Birthday Bible verses - rotates based on day of year
const BIRTHDAY_VERSES = [
  { text: "The LORD bless you and keep you; the LORD make his face shine on you and be gracious to you; the LORD turn his face toward you and give you peace.", ref: "Numbers 6:24-26" },
  { text: "For I know the plans I have for you, declares the LORD, plans to prosper you and not to harm you, plans to give you hope and a future.", ref: "Jeremiah 29:11" },
  { text: "The LORD your God is with you, the Mighty Warrior who saves. He will take great delight in you; in his love he will no longer rebuke you, but will rejoice over you with singing.", ref: "Zephaniah 3:17" },
  { text: "May he give you the desire of your heart and make all your plans succeed.", ref: "Psalm 20:4" },
  { text: "This is the day the LORD has made; let us rejoice and be glad in it.", ref: "Psalm 118:24" },
  { text: "Every good and perfect gift is from above, coming down from the Father of the heavenly lights, who does not change like shifting shadows.", ref: "James 1:17" },
  { text: "Delight yourself in the LORD, and he will give you the desires of your heart.", ref: "Psalm 37:4" },
  { text: "I praise you because I am fearfully and wonderfully made; your works are wonderful, I know that full well.", ref: "Psalm 139:14" },
  { text: "The LORD is my strength and my shield; my heart trusts in him, and he helps me. My heart leaps for joy, and with my song I praise him.", ref: "Psalm 28:7" },
  { text: "He has made everything beautiful in its time. He has also set eternity in the human heart.", ref: "Ecclesiastes 3:11" },
  { text: "But those who hope in the LORD will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.", ref: "Isaiah 40:31" },
  { text: "Sing to the LORD a new song, for he has done marvelous things.", ref: "Psalm 98:1" },
];

function getTodayVerse(): { text: string; ref: string } {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  return BIRTHDAY_VERSES[dayOfYear % BIRTHDAY_VERSES.length];
}

// Generate PERSONAL birthday blessing (sent to the birthday member)
function generatePersonalBirthdayEmail(member: Member): string {
  const firstName = member.name.split(' ')[0];
  const verse = getTodayVerse();
  const dob = new Date(member.date_of_birth!);
  const age = new Date().getFullYear() - dob.getFullYear();

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1a1a1a 0%, #2a1f1a 100%); border-radius: 16px; overflow: hidden;">
              <!-- Golden Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #d4a537 0%, #b8860b 100%); padding: 40px; text-align: center;">
                  <div style="font-size: 60px; margin-bottom: 10px;">🎂</div>
                  <h1 style="margin: 0; color: #000; font-size: 28px; font-weight: bold;">Happy Birthday, ${firstName}!</h1>
                  <p style="margin: 10px 0 0; color: #000; font-size: 16px;">Celebrating you today</p>
                </td>
              </tr>
              
              <!-- Personal Blessing -->
              <tr>
                <td style="padding: 30px; text-align: center;">
                  <div style="font-size: 24px; margin-bottom: 15px;">🎉 🎈 🎊 🎁 🎉</div>
                  <h2 style="margin: 0 0 15px; color: #d4a537; font-size: 22px;">Dear ${firstName},</h2>
                  <p style="color: #ccc; font-size: 16px; line-height: 1.8; margin: 0 0 20px;">
                    On this beautiful day, the entire Serenades of Praise family 
                    sends you our warmest birthday blessings! Your voice is a 
                    gift from God, and your presence in our choir brings joy to 
                    everyone around you.
                  </p>
                  <p style="color: #ccc; font-size: 16px; line-height: 1.8; margin: 0 0 20px;">
                    May this new year of your life be filled with God's abundant 
                    grace, beautiful melodies, and endless blessings. May you 
                    continue to grow in faith and use your talents to glorify 
                    His name.
                  </p>
                </td>
              </tr>

              <!-- Bible Verse -->
              <tr>
                <td style="padding: 0 30px 30px;">
                  <div style="background: linear-gradient(135deg, #d4a53720 0%, #b8860b15 100%); border-radius: 12px; padding: 25px; border: 1px solid #d4a53740; text-align: center;">
                    <div style="font-size: 30px; margin-bottom: 10px;">📖</div>
                    <p style="color: #fff; font-size: 16px; line-height: 1.8; font-style: italic; margin: 0 0 12px;">
                      "${verse.text}"
                    </p>
                    <p style="color: #d4a537; font-size: 14px; font-weight: bold; margin: 0;">
                      — ${verse.ref}
                    </p>
                  </div>
                </td>
              </tr>

              <!-- Birthday Prayer -->
              <tr>
                <td style="padding: 0 30px 30px; text-align: center;">
                  <div style="background-color: #252525; border-radius: 12px; padding: 25px;">
                    <p style="color: #d4a537; font-size: 14px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 12px;">A Birthday Prayer for You</p>
                    <p style="color: #ccc; font-size: 15px; line-height: 1.8; font-style: italic; margin: 0;">
                      Heavenly Father, we thank You for the gift of ${firstName}'s life. 
                      Bless ${firstName} with good health, joy, and peace in this new year. 
                      May Your love surround them, Your wisdom guide them, 
                      and Your grace sustain them. In Jesus' name, Amen.
                    </p>
                  </div>
                </td>
              </tr>

              <!-- Celebration Banner -->
              <tr>
                <td style="padding: 0 30px 30px; text-align: center;">
                  <div style="background: linear-gradient(135deg, #d4a537 0%, #b8860b 100%); border-radius: 8px; padding: 15px 30px; display: inline-block;">
                    <span style="color: #000; font-weight: bold; font-size: 16px;">🎵 Voices United in Celebrating You 🎵</span>
                  </div>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding: 20px 30px; background-color: #151515; text-align: center;">
                  <p style="margin: 0 0 8px; color: #d4a537; font-size: 14px; font-weight: bold;">With love from your Serenades of Praise Family ❤️</p>
                  <p style="margin: 0; color: #666; font-size: 11px;">Kacyiru SDA Church, Kigali, Rwanda</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// Generate birthday NOTIFICATION email (sent to ALL other members)
function generateBirthdayNotificationEmail(birthdayMembers: Member[]): string {
  const names = birthdayMembers.map(m => m.name);
  const nameList = names.length === 1 
    ? names[0] 
    : names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1];
  
  const isPlural = birthdayMembers.length > 1;
  const verse = getTodayVerse();

  const memberCards = birthdayMembers.map(m => {
    const firstName = m.name.split(' ')[0];
    return `
      <div style="background-color: #252525; border-radius: 12px; padding: 20px; margin-bottom: 12px; text-align: center; border: 1px solid #d4a53730;">
        <div style="font-size: 40px; margin-bottom: 8px;">🎂</div>
        <p style="color: #d4a537; font-size: 20px; font-weight: bold; margin: 0 0 4px;">${m.name}</p>
        <p style="color: #888; font-size: 13px; margin: 0;">Send ${firstName} a birthday wish today!</p>
      </div>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1a1a1a; border-radius: 16px; overflow: hidden;">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #d4a537 0%, #b8860b 100%); padding: 30px; text-align: center;">
                  <div style="font-size: 40px; margin-bottom: 8px;">🎉</div>
                  <h1 style="margin: 0; color: #000; font-size: 22px; font-weight: bold;">Birthday Celebration!</h1>
                  <p style="margin: 8px 0 0; color: #000; font-size: 14px;">Let's celebrate ${isPlural ? 'our choir members' : 'our choir member'} today</p>
                </td>
              </tr>
              
              <!-- Birthday Members -->
              <tr>
                <td style="padding: 30px;">
                  <p style="color: #ccc; font-size: 15px; line-height: 1.6; text-align: center; margin: 0 0 20px;">
                    Today is a special day! ${isPlural ? 'Some of our' : 'One of our'} beloved choir 
                    ${isPlural ? 'members are' : 'member is'} celebrating ${isPlural ? 'their' : 'a'} birthday. 
                    Let's shower ${isPlural ? 'them' : 'them'} with love and blessings!
                  </p>
                  ${memberCards}
                </td>
              </tr>

              <!-- Bible Verse -->
              <tr>
                <td style="padding: 0 30px 30px;">
                  <div style="background: #d4a53715; border-radius: 12px; padding: 20px; border: 1px solid #d4a53730; text-align: center;">
                    <p style="color: #fff; font-size: 14px; font-style: italic; line-height: 1.6; margin: 0 0 8px;">
                      "${verse.text}"
                    </p>
                    <p style="color: #d4a537; font-size: 13px; font-weight: bold; margin: 0;">— ${verse.ref}</p>
                  </div>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding: 20px 30px; background-color: #151515; text-align: center;">
                  <p style="margin: 0 0 8px; color: #888; font-size: 12px;">With love from the Serenades of Praise Family</p>
                  <p style="margin: 0; color: #666; font-size: 11px;">Kacyiru SDA Church, Kigali, Rwanda</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
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

// Send email via Gmail SMTP
async function sendEmail(to: string[], subject: string, html: string): Promise<boolean> {
  const GMAIL_USER = process.env.GMAIL_USER;
  const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;
  
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    console.error("Gmail credentials not configured");
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
    });

    await transporter.sendMail({
      from: `"Serenades of Praise" <${GMAIL_USER}>`,
      to: to.join(", "),
      subject: subject,
      html: html,
    });

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
      hasGmailUser: !!process.env.GMAIL_USER,
      hasGmailPassword: !!process.env.GMAIL_APP_PASSWORD,
      hasAdminEmails: !!process.env.ADMIN_NOTIFICATION_EMAILS,
      hasSupabaseUrl: !!(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL),
      hasSupabaseKey: !!(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY),
    };

    // Check if Gmail credentials are configured
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: "configuration_needed",
          message: "GMAIL_USER and GMAIL_APP_PASSWORD not configured",
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

    // ===== TODAY'S BIRTHDAYS =====
    const todayBirthdays = getTodayBirthdays(members);
    
    if (todayBirthdays.length > 0) {
      console.log(`🎂 TODAY's birthdays: ${todayBirthdays.map(m => m.name).join(', ')}`);
      
      const names = todayBirthdays.map(m => m.name);
      const nameList = names.length === 1 
        ? names[0] 
        : names.slice(0, -1).join(', ') + ' & ' + names[names.length - 1];

      // 1. Send PERSONAL birthday blessing to each birthday member
      for (const birthdayMember of todayBirthdays) {
        if (birthdayMember.email) {
          const personalSent = await sendEmail(
            [birthdayMember.email],
            `🎂 Happy Birthday, ${birthdayMember.name.split(' ')[0]}! From Your Serenades Family`,
            generatePersonalBirthdayEmail(birthdayMember)
          );
          if (personalSent) {
            console.log(`Personal birthday blessing sent to ${birthdayMember.name}`);
          }
        }
      }

      // 2. Send birthday NOTIFICATION to all OTHER members
      const birthdayMemberEmails = todayBirthdays.map(m => m.email?.toLowerCase()).filter(Boolean);
      const otherMemberEmails = members
        .map(m => m.email)
        .filter(Boolean)
        .filter(email => !birthdayMemberEmails.includes(email.toLowerCase()));
      
      if (otherMemberEmails.length > 0) {
        const notifSent = await sendEmail(
          otherMemberEmails,
          `🎂 Happy Birthday ${nameList}! Let's Celebrate!`,
          generateBirthdayNotificationEmail(todayBirthdays)
        );

        if (notifSent) {
          results.birthdayWishesSent = true;
          results.todayBirthdayCount = todayBirthdays.length;
          results.wishRecipients = otherMemberEmails.length + todayBirthdays.length;
          console.log(`Birthday notification sent to ${otherMemberEmails.length} other members`);
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

        // Finance summary: ONLY send to restricted recipients (finance + main admin)
        const financeList = process.env.FINANCE_NOTIFICATION_EMAILS?.split(',').map(e => e.trim()).filter(Boolean) || [];
        const adminListForFinance = process.env.ADMIN_NOTIFICATION_EMAILS?.split(',').map(e => e.trim()).filter(Boolean) || [];
        const financeEmails = [...new Set([...financeList, ...adminListForFinance].map(e => e.toLowerCase()))]
          .filter(Boolean);

        const financeEmailsSent = financeEmails.length > 0
          ? await sendEmail(
              financeEmails,
              `📊 Finance Report: ${overdueByMember.length} Members with Overdue Contributions`,
              generateFinanceOverdueEmail(overdueByMember)
            )
          : false;

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
