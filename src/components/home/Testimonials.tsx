import { useEffect, useRef, useState } from "react";
import { Quote, Star } from "lucide-react";

const testimonials = [
  {
    id: 1,
    name: "Pastor Emmanuel K.",
    role: "Senior Pastor, Kacyiru SDA Church",
    content:
      "The Serenades of Praise Choir has been a tremendous blessing to our church. Their dedication to worship and musical excellence truly touches hearts and draws people closer to God.",
    rating: 5,
  },
  {
    id: 2,
    name: "Marie Claire U.",
    role: "Church Member",
    content:
      "Every time this choir ministers, I feel the presence of God. Their harmonies are heavenly, and you can tell they sing from their hearts. They've inspired me to use my own gifts for God's glory.",
    rating: 5,
  },
  {
    id: 3,
    name: "Jean Baptiste M.",
    role: "Youth Leader, Musanze District",
    content:
      "When The Serenades came to our youth conference, it was transformational. The young people were moved to tears. Their ministry goes beyond music – it's a genuine encounter with God.",
    rating: 5,
  },
  {
    id: 4,
    name: "Grace N.",
    role: "Event Organizer",
    content:
      "Professional, punctual, and powerful in ministry. Working with The Serenades of Praise for our church event was a wonderful experience. They exceeded all expectations.",
    rating: 5,
  },
];

export function Testimonials() {
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
    <section ref={sectionRef} className="py-24 bg-charcoal section-pattern relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-1/4 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <span
            className={`inline-block text-primary text-sm font-semibold tracking-wider uppercase mb-4 transition-all duration-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            Testimonials
          </span>
          <h2
            className={`font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6 transition-all duration-700 delay-100 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            What People <span className="gold-text">Say</span>
          </h2>
          <p
            className={`text-lg text-muted-foreground max-w-2xl mx-auto transition-all duration-700 delay-200 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            Hear from those whose lives have been touched by our ministry
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.id}
              className={`card-glass rounded-2xl p-8 relative transition-all duration-700 hover:border-primary/30 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${300 + index * 100}ms` }}
            >
              {/* Quote icon */}
              <div className="absolute -top-4 -left-2 w-10 h-10 rounded-full bg-gold-gradient flex items-center justify-center">
                <Quote className="w-5 h-5 text-primary-foreground" />
              </div>

              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                ))}
              </div>

              {/* Content */}
              <p className="text-muted-foreground leading-relaxed mb-6 italic">
                "{testimonial.content}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gold-gradient flex items-center justify-center text-primary-foreground font-semibold">
                  {testimonial.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">{testimonial.name}</h4>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
