import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Calendar, MapPin, ArrowRight, Ticket } from "lucide-react";
import { Reveal, Stagger, StaggerItem, TiltCard } from "@/components/motion";
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
    <section className="py-24 bg-charcoal relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0" style={{
          backgroundImage: "radial-gradient(circle at 2px 2px, hsl(var(--primary) / 0.1) 1px, transparent 0)",
          backgroundSize: "40px 40px"
        }} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12">
          <Stagger stagger={0.1}>
            <StaggerItem>
              <span className="inline-block text-primary text-sm font-semibold tracking-wider uppercase mb-4">
                Upcoming
              </span>
            </StaggerItem>
            <StaggerItem>
              <h2 className="font-display text-4xl md:text-5xl font-bold">
                <span className="gold-text">Events</span> & Concerts
              </h2>
            </StaggerItem>
          </Stagger>
          <Reveal direction="left" delay={0.15} className="mt-6 md:mt-0">
            <Button variant="gold-outline" asChild className="group">
              <Link to="/events">
                View All Events
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1" />
              </Link>
            </Button>
          </Reveal>
        </div>
        {/* Events Grid or Empty State */}
        {events.length > 0 ? (
          <Stagger className="grid grid-cols-1 lg:grid-cols-3 gap-8" stagger={0.12}>
            {events.map((event) => (
              <StaggerItem key={event.id}>
                <TiltCard
                  maxTilt={7}
                  className="card-glass rounded-2xl overflow-hidden h-full group hover:border-primary/30 transition-colors duration-500"
                >
                  {event.image && (
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={event.image}
                        alt={event.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                      {!event.isFree && (
                        <div className="absolute top-4 right-4">
                          <span className="px-3 py-1 rounded-full bg-gold-gradient text-primary-foreground text-xs font-semibold">
                            <Ticket className="w-3 h-3 inline mr-1" />
                            Tickets Available
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="font-display text-xl font-semibold text-foreground mb-3">
                      {event.title}
                    </h3>
                    <div className="space-y-2 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        {new Date(event.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" />
                        {event.location}
                      </div>
                    </div>
                    <Link to="/events">
                      <Button variant="gold-outline" size="sm" className="w-full">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </TiltCard>
              </StaggerItem>
            ))}
          </Stagger>
        ) : (
          <Reveal direction="none" duration={0.7}>
            <div className="max-w-4xl mx-auto rounded-3xl overflow-hidden gold-glow-lg" style={{ background: "var(--gradient-gold)" }}>
              <div className="p-10 md:p-14 text-center">
                <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
                  Soon to be announced!
                </h2>
                <p className="text-primary-foreground/90 text-lg mb-2">
                  Currently we don't have a concert or an event to publish, but kindly stay tuned...
                </p>
                <p className="text-primary-foreground/100 text-lg mb-8 italic font-medium">
                  Re-visit our site & our social platforms to get more informed about anything. 
                </p>
              </div>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}
