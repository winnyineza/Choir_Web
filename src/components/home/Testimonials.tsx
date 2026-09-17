import { motion, useReducedMotion } from "motion/react";
import { Quote, Star } from "lucide-react";
import { Stagger, StaggerItem, TiltCard } from "@/components/motion";

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
  const reduced = useReducedMotion();

  return (
    <section className="py-24 bg-charcoal section-pattern relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-1/4 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float" />

      <div className="container mx-auto px-4 relative z-10">
        <Stagger className="text-center mb-16" stagger={0.1}>
          <StaggerItem>
            <span className="inline-block text-primary text-sm font-semibold tracking-wider uppercase mb-4">
              Testimonials
            </span>
          </StaggerItem>
          <StaggerItem>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              What People <span className="gold-text">Say</span>
            </h2>
          </StaggerItem>
          <StaggerItem>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Hear from those whose lives have been touched by our ministry
            </p>
          </StaggerItem>
        </Stagger>

        <Stagger className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto" stagger={0.12}>
          {testimonials.map((testimonial, index) => (
            <StaggerItem key={testimonial.id} direction={index % 2 === 0 ? "right" : "left"}>
              <TiltCard
                maxTilt={6}
                className="card-glass rounded-2xl p-8 relative h-full hover:border-primary/30 transition-colors duration-500"
              >
                {/* Quote icon */}
                <div className="absolute -top-4 -left-2 w-10 h-10 rounded-full bg-gold-gradient flex items-center justify-center">
                  <Quote className="w-5 h-5 text-primary-foreground" />
                </div>

                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <motion.span
                      key={i}
                      initial={reduced ? false : { opacity: 0, scale: 0.4, rotate: -45 }}
                      whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.25 + i * 0.07, type: "spring", stiffness: 400, damping: 18 }}
                    >
                      <Star className="w-4 h-4 fill-primary text-primary" />
                    </motion.span>
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
              </TiltCard>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
