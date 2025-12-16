import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Play, Users, Calendar, Music } from "lucide-react";
import choirImage from "@/assets/choir-group.jpg";

export function Hero() {
  const [visitorCount, setVisitorCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    // Simulate visitor counter animation
    const target = 1247; // Placeholder count
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;
    
    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        setVisitorCount(target);
        clearInterval(timer);
      } else {
        setVisitorCount(Math.floor(current));
      }
    }, 16);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Dark Overlay */}
      <div className="absolute inset-0">
        <img
          src={choirImage}
          alt="Serenades of Praise Choir"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-background/60" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-background/40 backdrop-blur-sm border border-foreground/10 mb-8 transition-all duration-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm font-medium tracking-widest uppercase text-foreground/80">Psalm 147:1</span>
          </div>

          {/* Title */}
          <h1
            className={`font-display text-5xl md:text-7xl lg:text-8xl font-semibold mb-6 transition-all duration-700 delay-150 leading-[0.95] ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <span className="text-foreground">Sing songs of</span>
            <br />
            <span className="text-primary italic">praise to God</span>
          </h1>

          {/* Decorative Line */}
          <div className={`flex items-center justify-center gap-2 mb-8 transition-all duration-700 delay-200 ${
            isVisible ? "opacity-100" : "opacity-0"
          }`}>
            <div className="w-16 h-0.5 bg-primary" />
            <div className="w-2 h-2 rounded-full bg-primary" />
            <div className="w-16 h-0.5 bg-primary" />
          </div>

          {/* Subtitle */}
          <p
            className={`text-lg md:text-xl text-foreground/70 max-w-xl mx-auto mb-12 leading-relaxed transition-all duration-700 delay-300 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            Experience divine connection through <span className="text-primary font-medium">powerful worship</span> and musical excellence that praie God.
          </p>

          {/* Stats */}
          <div
            className={`flex items-center justify-center gap-12 md:gap-20 mb-12 transition-all duration-700 delay-500 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-foreground">
                {visitorCount > 0 ? "2" : "0"}<span className="text-primary">+</span>
              </div>
              <div className="text-xs tracking-widest uppercase text-foreground/80 mt-1">Years in MISSION</div>
            </div>
            <div className="w-px h-12 bg-foreground/20" />
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-foreground">2024</div>
              <div className="text-xs tracking-widest uppercase text-foreground/80 mt-1 font-normal">Founded</div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div
            className={`flex flex-col sm:flex-row items-center justify-center gap-4 transition-all duration-700 delay-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <Button variant="gold" size="lg" asChild className="min-w-[180px]">
              <Link to="/join">
                <Users className="w-4 h-4 mr-2" />
                Join the Choir
              </Link>
            </Button>
            <Link
              to="/about"
              className="text-foreground/70 hover:text-foreground transition-colors flex items-center gap-2 group"
            >
              Discover More
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
            <Link
              to="/releases"
              className="text-foreground/70 hover:text-foreground transition-colors flex items-center gap-2 group"
            >
              <Play className="w-4 h-4" />
              Listen Now
            </Link>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <div className="flex flex-col items-center gap-2 text-foreground/40">
          <div className="w-px h-8 bg-gradient-to-b from-transparent via-foreground/30 to-foreground/50 animate-pulse" />
        </div>
      </div>
    </section>
  );
}
