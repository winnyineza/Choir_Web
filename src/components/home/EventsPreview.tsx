import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Calendar, MapPin, Clock, ArrowRight, Ticket, Mail } from "lucide-react";

const upcomingEvents = [
  {
    id: 1,
    title: "Salvation Story",
    date: "Dec 25, 2025",
    time: "3:00 PM",
    location: "Kacyiru SDA Church",
    image: "@/assets/",
    featured: true,
  },
  {
    id: 2,
    title: "New Year Praise Night",
    date: "Dec 31, 2024",
    time: "9:00 PM",
    location: "Convention Center Kigali",
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=400&fit=crop",
    featured: false,
  },
  {
    id: 3,
    title: "Youth Revival Weekend",
    date: "Jan 15, 2025",
    time: "3:00 PM",
    location: "Kacyiru SDA Church",
    image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&h=400&fit=crop",
    featured: false,
  },
];

export function EventsPreview() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

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
        <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto rounded-3xl overflow-hidden gold-glow-lg" style={{ background: "var(--gradient-gold)" }}>
              <div className="p-10 md:p-14 text-center">
                <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
                  Soon to be announced!
                </h2>
                <p className="text-primary-foreground/90 text-lg mb-2">
                  Currently we don't have a concert or an event to publish, but kindly stay tuned...
                </p>
                <p className="text-primary-foreground/100 text-lg mb-8 font-style: italic font-medium">
                  Re-visit our site & our social platforms to get more informed about anything. 
                </p>
              </div>
            </div>
          </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
        </div>
      </div>
    </section>
  );
}
