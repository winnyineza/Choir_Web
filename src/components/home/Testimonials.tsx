import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { EASE_OUT } from "@/lib/motionPresets";
import { Reveal } from "@/components/motion";

const testimonials = [
  {
    id: 1,
    name: "Pastor Emmanuel K.",
    role: "Senior Pastor, Kacyiru SDA Church",
    content:
      "The Serenades of Praise Choir has been a tremendous blessing to our church. Their dedication to worship and musical excellence truly touches hearts and draws people closer to God.",
  },
  {
    id: 2,
    name: "Marie Claire U.",
    role: "Church Member",
    content:
      "Every time this choir ministers, I feel the presence of God. Their harmonies are heavenly, and you can tell they sing from their hearts. They've inspired me to use my own gifts for God's glory.",
  },
  {
    id: 3,
    name: "Jean Baptiste M.",
    role: "Youth Leader, Musanze District",
    content:
      "When The Serenades came to our youth conference, it was transformational. The young people were moved to tears. Their ministry goes beyond music – it's a genuine encounter with God.",
  },
  {
    id: 4,
    name: "Grace N.",
    role: "Event Organizer",
    content:
      "Professional, punctual, and powerful in ministry. Working with The Serenades of Praise for our church event was a wonderful experience. They exceeded all expectations.",
  },
];

/** One voice at a time, set large, the way a magazine runs a pull quote. */
export function Testimonials() {
  const reduced = useReducedMotion();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (reduced || paused) return;
    const id = window.setInterval(() => setActive((i) => (i + 1) % testimonials.length), 9000);
    return () => window.clearInterval(id);
  }, [reduced, paused]);

  const current = testimonials[active];

  return (
    <section
      className="relative py-28 md:py-40 overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="container mx-auto px-4 lg:px-10">
        <Reveal className="mx-auto max-w-5xl text-center">
          <p className="mb-10 flex items-center justify-center gap-4 text-[0.65rem] uppercase tracking-luxe text-primary">
            <span className="font-display text-base normal-case tracking-normal italic">V</span>
            <span className="h-px w-8 bg-primary/60" />
            Kind words
            <span className="h-px w-8 bg-primary/60" />
          </p>

          <span aria-hidden className="block font-display text-[7rem] leading-[0.5] text-primary/40 select-none">“</span>

          <div className="relative min-h-[17rem] md:min-h-[14rem]" aria-live="polite">
            <AnimatePresence mode="wait">
              <motion.figure
                key={current.id}
                initial={{ opacity: 0, y: 14, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                transition={{ duration: reduced ? 0.2 : 0.9, ease: EASE_OUT }}
              >
                <blockquote className="font-display text-2xl md:text-4xl leading-[1.3] text-foreground text-balance">
                  {current.content}
                </blockquote>
                <figcaption className="mt-10 flex flex-col items-center gap-1">
                  <span className="text-sm font-medium text-foreground">{current.name}</span>
                  <span className="text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground">{current.role}</span>
                </figcaption>
              </motion.figure>
            </AnimatePresence>
          </div>

          <div className="mt-12 flex items-center justify-center gap-3" role="tablist" aria-label="Testimonials">
            {testimonials.map((t, i) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={i === active}
                aria-label={`Show words from ${t.name}`}
                onClick={() => setActive(i)}
                className="group py-3"
              >
                <span
                  className={`block h-px transition-all duration-700 ${
                    i === active ? "w-12 bg-primary" : "w-6 bg-foreground/25 group-hover:bg-foreground/60"
                  }`}
                />
              </button>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
