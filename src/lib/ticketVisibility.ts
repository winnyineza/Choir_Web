import type { Event } from "@/lib/dataService";

export function hasCreatedTickets(event: Pick<Event, "tickets">): boolean {
  return Array.isArray(event.tickets) && event.tickets.length > 0;
}

export function getTicketedEvents(events: Pick<Event, "tickets">[]): Pick<Event, "tickets">[] {
  return events.filter(hasCreatedTickets);
}
