import { type Event } from "./dataService";

function formatDateUTC(dateStr: string, time?: string) {
  const d = time ? new Date(`${dateStr}T${time}`) : new Date(dateStr);
  return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

export function generateICS(events: Event[]): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Serenades//Calendar//EN",
  ];
  events.forEach((event) => {
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${event.id}`);
    lines.push(`DTSTAMP:${formatDateUTC(new Date().toISOString())}`);
    lines.push(`DTSTART:${formatDateUTC(event.date, event.time)}`);
    lines.push(`SUMMARY:${event.title}`);
    lines.push(`DESCRIPTION:${event.description || ""}`);
    lines.push(`LOCATION:${event.location || ""}`);
    lines.push("END:VEVENT");
  });
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export function downloadICS(events: Event[], filename = "events.ics") {
  const blob = new Blob([generateICS(events)], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

