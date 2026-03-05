import { describe, it, expect } from "vitest";
import { hasCreatedTickets, getTicketedEvents } from "./ticketVisibility";

describe("ticketVisibility", () => {
  it("returns true when ticket tiers exist", () => {
    const event = { tickets: [{ id: "tier-1" }] } as any;
    expect(hasCreatedTickets(event)).toBe(true);
  });

  it("returns false when ticket tiers do not exist", () => {
    const event = { tickets: [] } as any;
    expect(hasCreatedTickets(event)).toBe(false);
  });

  it("filters event list based on created tickets", () => {
    const events = [
      { id: "a", tickets: [] },
      { id: "b", tickets: [{ id: "tier-1" }] },
      { id: "c", tickets: [{ id: "tier-2" }, { id: "tier-3" }] },
    ] as any;

    const ticketed = getTicketedEvents(events);
    expect(ticketed.map((event: any) => event.id)).toEqual(["b", "c"]);
  });
});
