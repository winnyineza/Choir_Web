import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Calendar, MapPin, ArrowRight, Ticket } from "lucide-react";
import { getBookableEvents, type Event } from "@/lib/dataService";

export function EventsPreview() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    // Load events from admin-managed data
    const bookableEvents = getBookableEvents();
    setEvents(bookableEvents.slice(0, 3)); // Show first 3 events
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 bg-charcoal relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0" style={{
          backgroundImage: "radial-gradient(circle at 2px 2px, hsl(45 80% 50% / 0.1) 1px, transparent 0)",
          backgroundSize: "40px 40px"
        }} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12">
          <div>
            <span
              className={`inline-block text-primary text-sm font-semibold tracking-wider uppercase mb-4 transition-all duration-700 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              Upcoming
            </span>
            <h2
              className={`font-display text-4xl md:text-5xl font-bold transition-all duration-700 delay-100 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              <span className="gold-text">Events</span> & Concerts
            </h2>
          </div>
          <Button
            variant="gold-outline"
            className={`mt-6 md:mt-0 transition-all duration-700 delay-200 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
            }`}
            asChild
          >
            <Link to="/events">
              View All Events
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
          
        </div>
        {/* Events Grid or Empty State */}
        {events.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {events.map((event, index) => (
              <div
                key={event.id}
                className={`card-glass rounded-2xl overflow-hidden transition-all duration-700 hover:border-primary/30 ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: `${300 + index * 100}ms` }}
              >
                {event.image && (
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={event.image}
                      alt={event.title}
                      className="w-full h-full object-cover"
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
              </div>
            ))}
          </div>
        ) : (
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
        )}
      </div>
    </section>
  );
}
