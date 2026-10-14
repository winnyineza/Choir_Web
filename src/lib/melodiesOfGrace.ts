import poster from "@/assets/melodies/poster.jpeg";
import clarionCall from "@/assets/melodies/clarion-call.jpg";
import messengersSingers from "@/assets/melodies/messengers-singers.jpg";
import balton from "@/assets/melodies/balton.jpg";

/** Single source of truth for the Melodies of Grace concert, shared by its page and the homepage feature. */
export const MELODIES_OF_GRACE = {
  path: "/melodies-of-grace",
  title: "Melodies of Grace",
  edition: "Edition I",
  tagline: "Many voices. One song of praise.",
  // 2:00 PM in Kigali (UTC+2).
  startsAt: new Date("2026-11-14T14:00:00+02:00"),
  // The programme length has not been announced; calendars get a three-hour placeholder.
  durationHours: 3,
  dateLabel: "Saturday, 14 November 2026",
  timeLabel: "2:00 PM, Kigali time",
  venue: "Kigali English Church (KEC)",
  address: "344F+XFP, KG 19 Ave, Kigali",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=344F%2BXFP%2C%20KG%2019%20Ave%2C%20Kigali",
  mapsEmbedUrl: "https://www.google.com/maps?q=344F%2BXFP%2C%20KG%2019%20Ave%2C%20Kigali&output=embed",
  contactPhone: "0780 623 144",
  poster,
  guests: [
    { name: "The Clarion Call Choir", image: clarionCall },
    { name: "Messengers Singers", image: messengersSingers },
    { name: "Balton", image: balton },
  ],
} as const;

/** The homepage stops promoting the concert the day after it happens. */
export function isMelodiesUpcoming(now = new Date()) {
  const end = new Date(MELODIES_OF_GRACE.startsAt.getTime() + 24 * 60 * 60 * 1000);
  return now < end;
}

function toIcsDate(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** Builds a calendar file so "Save the date" works in Apple, Google and Outlook calendars alike. */
export function buildMelodiesIcs(pageUrl: string) {
  const { startsAt, durationHours, title, edition, venue, address } = MELODIES_OF_GRACE;
  const end = new Date(startsAt.getTime() + durationHours * 60 * 60 * 1000);
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Serenades of Praise//Melodies of Grace//EN",
    "BEGIN:VEVENT",
    `UID:melodies-of-grace-2026@serenadesofpraise`,
    `DTSTAMP:${toIcsDate(new Date())}`,
    `DTSTART:${toIcsDate(startsAt)}`,
    `DTEND:${toIcsDate(end)}`,
    `SUMMARY:${title} — ${edition} · The Serenades of Praise`,
    `LOCATION:${venue}\\, ${address.replace(/,/g, "\\,")}`,
    `DESCRIPTION:A celebration of faith\\, music and togetherness. ${pageUrl}`,
    `URL:${pageUrl}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
