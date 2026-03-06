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

const LOGO_URL = "https://serenadesofpraise.netlify.app/LogoTSC.jpg";

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

interface MeetingSchedule {
  id: string;
  title: string;
  date: string;
  start_time?: string;
  location?: string;
  type?: "general" | "committee";
  attendees?: string[];
  google_meet_link?: string;
  google_event_link?: string;
}

interface ApprovedLeave {
  member_id: string;
  start_date: string;
  end_date: string;
  status: string;
}

interface MeetingReminderDelivery {
  id: string;
  meeting_id: string;
  meeting_title: string;
  meeting_date: string;
  recipient_email: string;
  recipient_name: string;
  reminder_type: string;
  reminder_date: string;
  job_run_id: string;
  sent_at: string;
}

interface Contribution {
  id: string;
  member_id: string;
  member_name?: string;
  member_email?: string;
  type_id?: string;
  type_name?: string;
  type: string;
  category: 'monthly' | 'special';
  amount: number;
  month?: number;
  year?: number;
  payment_method?: string;
  reference?: string;
  notes?: string;
  recorded_by?: string;
  created_at: string;
}

interface ContributionType {
  id: string;
  name: string;
  category: 'monthly' | 'special';
  amount: number;
  is_active: boolean;
  deadline?: string;
}

interface MemberWithContributions extends Member {
  contributions?: Contribution[];
  overdueAmount?: number;
  upcomingAmount?: number;
}

const ONE_DAY_MS = 1000 * 60 * 60 * 24;

function parseDateOnly(dateValue: string): Date {
  const [year, month, day] = dateValue.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function getDateOnly(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function getBirthdayDaysUntil(dateOfBirth: string, referenceDate: Date = new Date()): number {
  const dob = parseDateOnly(dateOfBirth);
  const today = getDateOnly(referenceDate);

  const nextBirthday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
  if (nextBirthday < today) {
    nextBirthday.setFullYear(today.getFullYear() + 1);
  }

  return Math.round((nextBirthday.getTime() - today.getTime()) / ONE_DAY_MS);
}

// Helper to get TODAY's birthdays (for sending wishes)
function getTodayBirthdays(members: Member[]): Member[] {
  const today = getDateOnly(new Date());
  const todayMonth = today.getMonth();
  const todayDate = today.getDate();

  return members.filter(member => {
    if (!member.date_of_birth) return false;
    const dob = parseDateOnly(member.date_of_birth);
    return dob.getMonth() === todayMonth && dob.getDate() === todayDate;
  });
}

// Helper to get upcoming birthdays (for admin reminders)
function getUpcomingBirthdays(members: Member[], daysAhead: number = 7): Member[] {
  const today = getDateOnly(new Date());
  const upcoming: Member[] = [];

  members.forEach(member => {
    if (!member.date_of_birth) return;
    const daysUntil = getBirthdayDaysUntil(member.date_of_birth, today);
    
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

function getTomorrowMeetings(meetings: MeetingSchedule[]): MeetingSchedule[] {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  return meetings.filter((meeting) => {
    const meetingDate = new Date(meeting.date).toISOString().split('T')[0];
    return meetingDate === tomorrowStr;
  });
}

// Helper to find unpaid months for a member (months where they have no monthly contribution)
function getUnpaidMonthsForMember(
  memberId: string,
  contributions: Contribution[],
  monthlyAmount: number
): { month: number; year: number; expectedAmount: number }[] {
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-12
  const currentYear = now.getFullYear();
  const unpaid: { month: number; year: number; expectedAmount: number }[] = [];

  // Check each month of the current year up to the current month
  for (let m = 1; m <= currentMonth; m++) {
    const paid = contributions.filter(
      c => c.member_id === memberId && c.category === 'monthly' && c.month === m && c.year === currentYear
    );
    const paidAmount = paid.reduce((sum, c) => sum + c.amount, 0);
    if (paidAmount < monthlyAmount) {
      unpaid.push({ month: m, year: currentYear, expectedAmount: monthlyAmount - paidAmount });
    }
  }

  return unpaid;
}

// Helper to find special contributions with deadlines that are approaching or overdue
function getSpecialContributionReminders(
  memberId: string,
  contributions: Contribution[],
  types: ContributionType[]
): { overdue: ContributionType[]; upcoming: ContributionType[] } {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const weekFromNow = new Date(now);
  weekFromNow.setDate(weekFromNow.getDate() + 7);

  const overdue: ContributionType[] = [];
  const upcoming: ContributionType[] = [];

  for (const type of types) {
    if (type.category !== 'special' || !type.is_active || !type.deadline) continue;

    const deadline = new Date(type.deadline);
    const memberPaid = contributions
      .filter(c => c.member_id === memberId && c.type_id === type.id)
      .reduce((sum, c) => sum + c.amount, 0);

    if (memberPaid >= type.amount) continue; // Already fully paid

    if (deadline < now) {
      overdue.push(type);
    } else if (deadline <= weekFromNow) {
      upcoming.push(type);
    }
  }

  return { overdue, upcoming };
}

// Month names for display
const MONTH_NAMES = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Generate contribution reminder email for a member
function generateContributionReminderEmail(
  memberName: string,
  unpaidMonths: { month: number; year: number; expectedAmount: number }[],
  overdueSpecial: ContributionType[],
  upcomingSpecial: ContributionType[]
): string {
  const formatAmount = (amount: number) => `${amount.toLocaleString()} RWF`;

  let unpaidHtml = '';
  if (unpaidMonths.length > 0) {
    const totalUnpaid = unpaidMonths.reduce((sum, m) => sum + m.expectedAmount, 0);
    const unpaidItems = unpaidMonths.map(m => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #333;">Monthly Dues</td>
        <td style="padding: 10px; border-bottom: 1px solid #333; text-align: center;">${MONTH_NAMES[m.month]} ${m.year}</td>
        <td style="padding: 10px; border-bottom: 1px solid #333; text-align: right; color: #ff6b6b;">${formatAmount(m.expectedAmount)}</td>
      </tr>
    `).join('');

    unpaidHtml = `
      <div style="margin: 20px 0; padding: 15px; background: #4a2020; border-radius: 8px; border-left: 4px solid #ff6b6b;">
        <h3 style="color: #ff6b6b; margin-top: 0;">⚠️ Unpaid Monthly Dues</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #3a1515;">
              <th style="padding: 10px; text-align: left;">Type</th>
              <th style="padding: 10px; text-align: center;">Month</th>
              <th style="padding: 10px; text-align: right;">Amount Due</th>
            </tr>
          </thead>
          <tbody>${unpaidItems}</tbody>
        </table>
        <p style="margin-top: 15px; font-weight: bold; color: #ff6b6b;">Total Outstanding: ${formatAmount(totalUnpaid)}</p>
      </div>
    `;
  }

  let specialHtml = '';
  if (overdueSpecial.length > 0 || upcomingSpecial.length > 0) {
    const items = [
      ...overdueSpecial.map(t => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #333;">${t.name}</td>
          <td style="padding: 10px; border-bottom: 1px solid #333; text-align: right; color: #ff6b6b;">${formatAmount(t.amount)}</td>
          <td style="padding: 10px; border-bottom: 1px solid #333; text-align: right; color: #ff6b6b;">Overdue${t.deadline ? ' (' + new Date(t.deadline).toLocaleDateString() + ')' : ''}</td>
        </tr>
      `),
      ...upcomingSpecial.map(t => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #333;">${t.name}</td>
          <td style="padding: 10px; border-bottom: 1px solid #333; text-align: right;">${formatAmount(t.amount)}</td>
          <td style="padding: 10px; border-bottom: 1px solid #333; text-align: right; color: #d4a537;">Due ${t.deadline ? new Date(t.deadline).toLocaleDateString() : 'soon'}</td>
        </tr>
      `)
    ].join('');

    specialHtml = `
      <div style="margin: 20px 0;">
        <h3 style="color: #d4a537;">📅 Special Contributions</h3>
        <table style="width: 100%; border-collapse: collapse; background: #2a2a2a; border-radius: 8px;">
          <thead>
            <tr style="background: #333;">
              <th style="padding: 10px; text-align: left;">Contribution</th>
              <th style="padding: 10px; text-align: right;">Amount</th>
              <th style="padding: 10px; text-align: right;">Status</th>
            </tr>
          </thead>
          <tbody>${items}</tbody>
        </table>
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
        <div style="text-align: center; margin-bottom: 16px;">
          <img src="${LOGO_URL}" alt="Serenades of Praise" style="width: 64px; height: 64px; border-radius: 50%; object-fit: cover; border: 3px solid rgba(212, 165, 55, 0.35); margin-bottom: 12px;" />
        </div>
        <h1>💰 Contribution Reminder</h1>
        <p>Dear ${memberName},</p>
        <p>This is a friendly reminder about your choir contributions:</p>
        ${unpaidHtml}
        ${specialHtml}
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
  overdueByMember: { member: Member; unpaidMonths: number; totalDue: number }[]
): string {
  const formatAmount = (amount: number) => `${amount.toLocaleString()} RWF`;
  const grandTotal = overdueByMember.reduce((sum, m) => sum + m.totalDue, 0);
  
  const memberRows = overdueByMember.map(({ member, unpaidMonths, totalDue }) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #333;">${member.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #333;">${member.email}</td>
      <td style="padding: 10px; border-bottom: 1px solid #333; text-align: center;">${unpaidMonths} month${unpaidMonths > 1 ? 's' : ''}</td>
      <td style="padding: 10px; border-bottom: 1px solid #333; text-align: right; color: #ff6b6b; font-weight: bold;">${formatAmount(totalDue)}</td>
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
        <div style="text-align: center; margin-bottom: 16px;">
          <img src="${LOGO_URL}" alt="Serenades of Praise" style="width: 64px; height: 64px; border-radius: 50%; object-fit: cover; border: 3px solid rgba(212, 165, 55, 0.35); margin-bottom: 12px;" />
        </div>
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
function generateBirthdayReminderEmail(birthdays: Member[], daysAhead: number = 7): string {
  const birthdayItems = birthdays
    .map(member => {
      const dob = parseDateOnly(member.date_of_birth!);
      const daysUntil = getBirthdayDaysUntil(member.date_of_birth!);
      return {
        name: member.name,
        dayLabel: dob.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
        daysUntil,
      };
    })
    .sort((a, b) => a.daysUntil - b.daysUntil);

  const nearestDays = birthdayItems[0]?.daysUntil ?? daysAhead;
  const nearestLabel = nearestDays === 1 ? "1 day" : `${nearestDays} days`;

  const birthdayList = birthdayItems
    .map(item => {
      const suffix = item.daysUntil === 1 ? 'day' : 'days';
      return `<li><strong>${item.name}</strong> - ${item.dayLabel} <span style="color: #d4a537;">(in ${item.daysUntil} ${suffix})</span></li>`;
    })
    .join('');

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
        <div style="text-align: center; margin-bottom: 16px;">
          <img src="${LOGO_URL}" alt="Serenades of Praise" style="width: 64px; height: 64px; border-radius: 50%; object-fit: cover; border: 3px solid rgba(212, 165, 55, 0.35); margin-bottom: 12px;" />
        </div>
        <h1>🎂 Upcoming Birthdays!</h1>
        <p>Next birthday is in <strong>${nearestLabel}</strong>. Here are all upcoming birthdays within the next ${daysAhead} days:</p>
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
                  <img src="${LOGO_URL}" alt="Serenades of Praise" style="width: 64px; height: 64px; border-radius: 50%; object-fit: cover; border: 3px solid rgba(212, 165, 55, 0.35); margin-bottom: 12px;" />
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
                  <img src="${LOGO_URL}" alt="Serenades of Praise" style="width: 64px; height: 64px; border-radius: 50%; object-fit: cover; border: 3px solid rgba(212, 165, 55, 0.35); margin-bottom: 12px;" />
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
        <div style="text-align: center; margin-bottom: 16px;">
          <img src="${LOGO_URL}" alt="Serenades of Praise" style="width: 64px; height: 64px; border-radius: 50%; object-fit: cover; border: 3px solid rgba(212, 165, 55, 0.35); margin-bottom: 12px;" />
        </div>
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

function generateMeetingReminderEmail(memberName: string, meetings: MeetingSchedule[]): string {
  const meetingList = meetings.map((meeting) => `
    <div style="padding: 15px; background: #2a2a2a; margin-bottom: 10px; border-radius: 8px; border-left: 4px solid #d4a537;">
      <strong style="color: #d4a537; font-size: 16px;">${meeting.title}</strong><br>
      <span style="color: #aaa;">📅 ${new Date(meeting.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span><br>
      ${meeting.start_time ? `<span style="color: #aaa;">⏰ ${meeting.start_time}</span><br>` : ''}
      ${meeting.location ? `<span style="color: #aaa;">📍 ${meeting.location}</span><br>` : ''}
      ${meeting.google_meet_link ? `<a href="${meeting.google_meet_link}" style="color: #d4a537; text-decoration: none;">🎥 Join Google Meet</a>` : ''}
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
        <div style="text-align: center; margin-bottom: 16px;">
          <img src="${LOGO_URL}" alt="Serenades of Praise" style="width: 64px; height: 64px; border-radius: 50%; object-fit: cover; border: 3px solid rgba(212, 165, 55, 0.35); margin-bottom: 12px;" />
        </div>
        <h1>📅 Meeting Reminder - Tomorrow</h1>
        <p>Hi ${memberName},</p>
        <p>This is a reminder for your upcoming meeting${meetings.length > 1 ? 's' : ''} tomorrow:</p>
        ${meetingList}
        <p style="margin-top: 20px;">Please be prepared and on time. Blessings!</p>
        <div class="footer">
          <p>Serenades of Praise Choir</p>
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
    const normalizeReadableEmailHtml = (rawHtml: string): string => {
      const tags = ["p", "li", "td", "th", "span", "div", "a"];
      let normalized = rawHtml;

      for (const tag of tags) {
        const withStyleRegex = new RegExp(`<${tag}([^>]*?)style=\"([^\"]*)\"([^>]*)>`, "gi");
        normalized = normalized.replace(withStyleRegex, (_match, before, style, after) => {
          if (/\bcolor\s*:/i.test(style)) {
            return `<${tag}${before}style="${style}"${after}>`;
          }
          const separator = style.trim().endsWith(";") || style.trim().length === 0 ? "" : ";";
          return `<${tag}${before}style="${style}${separator} color: #f5f5f5;"${after}>`;
        });

        const withoutStyleRegex = new RegExp(`<${tag}(?![^>]*style=)([^>]*)>`, "gi");
        normalized = normalized.replace(withoutStyleRegex, `<${tag} style="color: #f5f5f5;"$1>`);
      }

      normalized = normalized.replace(
        /<body(?![^>]*style=)([^>]*)>/gi,
        '<body style="margin: 0; padding: 0; background-color: #0a0a0a; color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif;"$1>',
      );

      return normalized;
    };

    const normalizedHtml = normalizeReadableEmailHtml(html);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
    });

    await transporter.sendMail({
      from: `"Serenades of Praise" <${GMAIL_USER}>`,
      to: to.join(", "),
      subject: subject,
      html: normalizedHtml,
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
    const jobRunId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

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
      meetingRemindersSent: 0,
      meetingCount: 0,
      meetingRecipients: 0,
      meetingReminderDuplicatesSkipped: 0,
      meetingReminderLogsInserted: 0,
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
    let meetings: MeetingSchedule[] = [];
    let approvedLeave: ApprovedLeave[] = [];
    let contributions: Contribution[] = [];
    let contributionTypes: ContributionType[] = [];

    if (SUPABASE_URL && SUPABASE_KEY) {
      const headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      };

      const getExistingMeetingReminderKeys = async (reminderDate: string): Promise<Set<string>> => {
        try {
          const res = await fetch(
            `${SUPABASE_URL}/rest/v1/meeting_reminder_deliveries?select=meeting_id,recipient_email&reminder_type=eq.day_before_meeting&reminder_date=eq.${reminderDate}`,
            { headers },
          );

          if (!res.ok) {
            const text = await res.text();
            console.error("Failed to fetch existing meeting reminder logs:", text);
            return new Set<string>();
          }

          const rows = (await res.json()) as Array<{ meeting_id: string; recipient_email: string }>;
          return new Set(rows.map((row) => `${row.meeting_id}|${row.recipient_email.toLowerCase()}`));
        } catch (e) {
          console.error("Failed to query meeting reminder logs:", e);
          return new Set<string>();
        }
      };

      const insertMeetingReminderLogs = async (rows: MeetingReminderDelivery[]): Promise<number> => {
        if (rows.length === 0) return 0;

        try {
          const res = await fetch(`${SUPABASE_URL}/rest/v1/meeting_reminder_deliveries`, {
            method: "POST",
            headers: {
              ...headers,
              "Content-Type": "application/json",
              Prefer: "resolution=ignore-duplicates,return=minimal",
            },
            body: JSON.stringify(rows),
          });

          if (!res.ok) {
            const text = await res.text();
            console.error("Failed to insert meeting reminder logs:", text);
            return 0;
          }

          return rows.length;
        } catch (e) {
          console.error("Failed to write meeting reminder logs:", e);
          return 0;
        }
      };

      // Fetch members
      try {
        const membersRes = await fetch(`${SUPABASE_URL}/rest/v1/members?select=id,name,email,date_of_birth&status=eq.Active`, { headers });
        if (membersRes.ok) {
          members = await membersRes.json();
          console.log(`Fetched ${members.length} active members`);
        }
      } catch (e) {
        console.error("Failed to fetch members:", e);
      }

      // Fetch events
      try {
        const eventsRes = await fetch(`${SUPABASE_URL}/rest/v1/events?select=id,title,date,time,location`, { headers });
        if (eventsRes.ok) {
          events = await eventsRes.json();
          console.log(`Fetched ${events.length} events`);
        }
      } catch (e) {
        console.error("Failed to fetch events:", e);
      }

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      // Fetch tomorrow's meetings
      try {
        const meetingsRes = await fetch(
          `${SUPABASE_URL}/rest/v1/meeting_minutes?select=id,title,date,start_time,location,type,attendees,google_meet_link,google_event_link&date=eq.${tomorrowStr}`,
          { headers },
        );
        if (meetingsRes.ok) {
          meetings = await meetingsRes.json();
          console.log(`Fetched ${meetings.length} meetings for tomorrow`);
        }
      } catch (e) {
        console.error("Failed to fetch meetings:", e);
      }

      // Fetch approved leave for tomorrow
      try {
        const leaveRes = await fetch(
          `${SUPABASE_URL}/rest/v1/leave_requests?select=member_id,start_date,end_date,status&status=eq.approved&start_date=lte.${tomorrowStr}&end_date=gte.${tomorrowStr}`,
          { headers },
        );
        if (leaveRes.ok) {
          approvedLeave = await leaveRes.json();
          console.log(`Fetched ${approvedLeave.length} approved leave record(s) for tomorrow`);
        }
      } catch (e) {
        console.error("Failed to fetch approved leave:", e);
      }

      // Fetch all contributions for the current year
      const currentYear = new Date().getFullYear();
      try {
        const contributionsRes = await fetch(
          `${SUPABASE_URL}/rest/v1/contributions?select=*&year=eq.${currentYear}`,
          { headers }
        );
        if (contributionsRes.ok) {
          contributions = await contributionsRes.json();
          console.log(`Fetched ${contributions.length} contributions for ${currentYear}`);
        }
      } catch (e) {
        console.error("Failed to fetch contributions:", e);
      }

      // Fetch contribution types
      try {
        const typesRes = await fetch(
          `${SUPABASE_URL}/rest/v1/contribution_types?select=*&is_active=eq.true`,
          { headers }
        );
        if (typesRes.ok) {
          contributionTypes = await typesRes.json();
          console.log(`Fetched ${contributionTypes.length} contribution types`);
        }
      } catch (e) {
        console.error("Failed to fetch contribution types:", e);
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
    const upcomingWindowDays = 7;
    const upcomingBirthdays = getUpcomingBirthdays(members, upcomingWindowDays);
    
    if (upcomingBirthdays.length > 0) {
      console.log(`Found ${upcomingBirthdays.length} upcoming birthdays (next 7 days)`);
      const nearestBirthdayDays = upcomingBirthdays.reduce((minDays, member) => {
        const daysUntil = getBirthdayDaysUntil(member.date_of_birth!);
        return Math.min(minDays, daysUntil);
      }, Number.MAX_SAFE_INTEGER);
      
      const sent = await sendEmail(
        adminEmails,
        `🎂 ${upcomingBirthdays.length} Upcoming Birthday${upcomingBirthdays.length > 1 ? 's' : ''} (next in ${nearestBirthdayDays} day${nearestBirthdayDays === 1 ? '' : 's'})`,
        generateBirthdayReminderEmail(upcomingBirthdays, upcomingWindowDays)
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

    // Check for tomorrow's meetings and notify intended members
    const tomorrowMeetings = getTomorrowMeetings(meetings);
    if (tomorrowMeetings.length > 0) {
      const onLeaveIds = new Set(approvedLeave.map((leave) => leave.member_id));
      const eligibleMembers = members.filter((member) => member.email && !onLeaveIds.has(member.id));
      const reminderDate = tomorrowMeetings[0].date;
      const existingReminderKeys = await getExistingMeetingReminderKeys(reminderDate);

      const recipientMap = new Map<string, { name: string; meetings: MeetingSchedule[]; logs: MeetingReminderDelivery[] }>();

      for (const meeting of tomorrowMeetings) {
        let recipients = eligibleMembers;

        if (meeting.type === 'committee' && Array.isArray(meeting.attendees) && meeting.attendees.length > 0) {
          const attendeeNames = new Set(meeting.attendees.map((name) => String(name).trim().toLowerCase()));
          recipients = eligibleMembers.filter((member) => attendeeNames.has(member.name.trim().toLowerCase()));
        }

        for (const recipient of recipients) {
          if (!recipient.email) continue;
          const emailKey = recipient.email.toLowerCase();
          const uniqueReminderKey = `${meeting.id}|${emailKey}`;

          if (existingReminderKeys.has(uniqueReminderKey)) {
            results.meetingReminderDuplicatesSkipped += 1;
            continue;
          }

          const existing = recipientMap.get(emailKey);
          const deliveryLog: MeetingReminderDelivery = {
            id: `mr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            meeting_id: meeting.id,
            meeting_title: meeting.title,
            meeting_date: meeting.date,
            recipient_email: emailKey,
            recipient_name: recipient.name,
            reminder_type: "day_before_meeting",
            reminder_date: reminderDate,
            job_run_id: jobRunId,
            sent_at: new Date().toISOString(),
          };

          if (existing) {
            if (!existing.meetings.some((item) => item.id === meeting.id)) {
              existing.meetings.push(meeting);
            }
            existing.logs.push(deliveryLog);
          } else {
            recipientMap.set(emailKey, { name: recipient.name, meetings: [meeting], logs: [deliveryLog] });
          }
        }
      }

      let meetingEmailsSent = 0;
      const successfulLogs: MeetingReminderDelivery[] = [];
      for (const [email, payload] of recipientMap.entries()) {
        const subject = payload.meetings.length > 1
          ? `📅 Reminder: ${payload.meetings.length} Meetings Tomorrow`
          : `📅 Reminder: ${payload.meetings[0].title} Tomorrow`;

        const sent = await sendEmail([email], subject, generateMeetingReminderEmail(payload.name, payload.meetings));
        if (sent) {
          meetingEmailsSent += 1;
          successfulLogs.push(...payload.logs);
        }
      }

      const insertedLogs = await insertMeetingReminderLogs(successfulLogs);

      results.meetingCount = tomorrowMeetings.length;
      results.meetingRecipients = recipientMap.size;
      results.meetingRemindersSent = meetingEmailsSent;
      results.meetingReminderLogsInserted = insertedLogs;
    }

    // ===== CONTRIBUTION REMINDERS =====
    // Find the monthly dues amount
    const monthlyType = contributionTypes.find(t => t.category === 'monthly');
    const monthlyAmount = monthlyType?.amount || 0;

    if (members.length > 0 && monthlyAmount > 0) {
      const overdueByMember: { member: Member; unpaidMonths: number; totalDue: number }[] = [];
      let totalMembersReminded = 0;

      for (const member of members) {
        if (!member.email) continue;

        // Check unpaid monthly dues
        const unpaidMonths = getUnpaidMonthsForMember(member.id, contributions, monthlyAmount);

        // Check special contributions
        const specialReminders = getSpecialContributionReminders(member.id, contributions, contributionTypes);

        // Determine if we need to send a reminder
        const hasUnpaid = unpaidMonths.length > 0;
        const hasSpecial = specialReminders.overdue.length > 0 || specialReminders.upcoming.length > 0;

        if (hasUnpaid || hasSpecial) {
          const sent = await sendEmail(
            [member.email],
            hasUnpaid
              ? `⚠️ Contribution Reminder: You have ${unpaidMonths.length} unpaid month${unpaidMonths.length > 1 ? 's' : ''}`
              : `💰 Contribution Reminder: Special contributions due`,
            generateContributionReminderEmail(
              member.name,
              unpaidMonths,
              specialReminders.overdue,
              specialReminders.upcoming
            )
          );

          if (sent) {
            totalMembersReminded++;
            if (hasUnpaid) results.overdueRemindersSent++;
            else results.contributionRemindersSent++;
          }

          // Track for finance summary
          if (hasUnpaid) {
            const totalDue = unpaidMonths.reduce((sum, m) => sum + m.expectedAmount, 0);
            overdueByMember.push({ member, unpaidMonths: unpaidMonths.length, totalDue });
          }
        }
      }

      console.log(`Sent contribution reminders to ${totalMembersReminded} members`);

      // Send finance admin summary if there are overdues
      if (overdueByMember.length > 0) {
        // Sort by total overdue (highest first)
        overdueByMember.sort((a, b) => b.totalDue - a.totalDue);

        // Finance summary: ONLY send to restricted recipients (finance + main admin)
        const financeList = process.env.FINANCE_NOTIFICATION_EMAILS?.split(',').map(e => e.trim()).filter(Boolean) || [];
        const adminListForFinance = process.env.ADMIN_NOTIFICATION_EMAILS?.split(',').map(e => e.trim()).filter(Boolean) || [];
        const financeEmails = [...new Set([...financeList, ...adminListForFinance].map(e => e.toLowerCase()))]
          .filter(Boolean);

        const financeEmailsSent = financeEmails.length > 0
          ? await sendEmail(
              financeEmails,
              `📊 Finance Report: ${overdueByMember.length} Members with Unpaid Contributions`,
              generateFinanceOverdueEmail(overdueByMember)
            )
          : false;

        if (financeEmailsSent) {
          results.financeReportSent = true;
          results.membersWithOverdue = overdueByMember.length;
          results.totalOverdueAmount = overdueByMember.reduce((sum, m) => sum + m.totalDue, 0);
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
          meetingsFound: meetings.length,
          contributionsFound: contributions.length,
          contributionTypesFound: contributionTypes.length,
          monthlyDuesAmount: monthlyAmount,
          todayBirthdays: todayBirthdays.map(m => m.name),
          upcomingBirthdays: upcomingBirthdays.map(m => m.name),
          tomorrowEvents: tomorrowEvents.map(e => e.title),
          tomorrowMeetings: tomorrowMeetings.map(m => m.title),
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
