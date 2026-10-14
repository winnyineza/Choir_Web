import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { SectionHead } from "@/components/editorial";
import { getBookableEvents, type Event } from "@/lib/dataService";

export function EventsPreview() {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    async function load() {
      const data = await getBookableEvents();
      setEvents(data.slice(0, 3)); // Show first 3 events
    }
    load();
  }, []);

  return (
    <section className="relative py-28 md:py-40 bg-charcoal border-y border-foreground/[0.06]">
      <div className="container mx-auto px-4 lg:px-10">
        <SectionHead
          align="split"
          index="IV"
          eyebrow="The calendar"
          title={<>Concerts <span className="italic text-primary">&amp;</span> gatherings.</>}
          lede="Come and hear the choir in person. Some evenings are free; for others, reserve a seat in advance."
          action={
            events.length > 0 ? (
              <Link to="/events" className="link-luxe">
                All events
                <span className="link-luxe-rule" />
              </Link>
            ) : undefined
          }
        />

        {/* Events as a printed programme listing */}
        {events.length > 0 ? (
          <Stagger className="border-t border-foreground/10" stagger={0.1}>
            {events.map((event) => {
              const date = new Date(event.date);
              return (
                <StaggerItem key={event.id}>
                  <Link
                    to="/events"
                    className="group grid grid-cols-[4.5rem_1fr_auto] md:grid-cols-[7rem_1fr_14rem_auto] items-center gap-6 md:gap-10 py-8 border-b border-foreground/10"
                  >
                    <span className="flex flex-col leading-none">
                      <span className="font-display text-5xl md:text-6xl text-foreground tabular-nums">
                        {date.toLocaleDateString("en-US", { day: "2-digit" })}
                      </span>
                      <span className="mt-2 text-[0.62rem] uppercase tracking-luxe text-primary">
                        {date.toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                      </span>
                    </span>
                    <span>
                      <span className="block font-display text-2xl md:text-4xl text-foreground transition-colors duration-500 group-hover:text-primary">
                        {event.title}
                      </span>
                      <span className="mt-2 block text-sm text-muted-foreground md:hidden">{event.location}</span>
                    </span>
                    <span className="hidden md:block text-sm text-muted-foreground">
                      {event.location}
                      {!event.isFree && (
                        <span className="mt-1 block text-[0.62rem] uppercase tracking-[0.2em] text-primary">Tickets available</span>
                      )}
                    </span>
                    <span className="flex h-12 w-12 items-center justify-center rounded-full border border-foreground/15 transition-all duration-700 group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
                      <ArrowUpRight className="h-4 w-4 transition-transform duration-700 group-hover:rotate-45" />
                    </span>
                  </Link>
                </StaggerItem>
              );
            })}
          </Stagger>
        ) : (
          <Reveal direction="none">
            <div className="border-y border-foreground/10 py-16 md:py-20 text-center">
              <p className="font-display italic text-3xl md:text-5xl text-foreground">
                The next concert is being prepared.
              </p>
              <p className="mt-6 text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                No dates are published just yet. Subscribe below or follow us on social media to hear first.
              </p>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}
