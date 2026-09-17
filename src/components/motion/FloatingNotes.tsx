import { useMemo } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

const GLYPHS = ["\u266A", "\u266B", "\u266C", "\u2669"];

interface Note {
  glyph: string;
  left: number;
  size: number;
  delay: number;
  duration: number;
  drift: number;
  rotate: number;
  opacity: number;
}

/** Deterministic pseudo-random so the layout does not jump between renders. */
function seeded(seed: number) {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

export interface FloatingNotesProps {
  count?: number;
  className?: string;
}

/** Ambient musical notes drifting upward behind hero content. Purely decorative. */
export function FloatingNotes({ count = 14, className }: FloatingNotesProps) {
  const reduced = useReducedMotion();

  const notes = useMemo<Note[]>(
    () =>
      Array.from({ length: count }, (_, i) => ({
        glyph: GLYPHS[i % GLYPHS.length],
        left: seeded(i + 1) * 100,
        size: 14 + seeded(i + 2) * 26,
        delay: seeded(i + 3) * 12,
        duration: 14 + seeded(i + 4) * 12,
        drift: (seeded(i + 5) - 0.5) * 120,
        rotate: (seeded(i + 6) - 0.5) * 60,
        opacity: 0.12 + seeded(i + 7) * 0.22,
      })),
    [count]
  );

  if (reduced) return null;

  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      {notes.map((note, i) => (
        <motion.span
          key={i}
          className="absolute bottom-[-10%] select-none text-primary"
          style={{ left: `${note.left}%`, fontSize: note.size }}
          initial={{ y: 0, opacity: 0 }}
          animate={{
            y: ["0%", "-140vh"],
            x: [0, note.drift, 0],
            rotate: [0, note.rotate, 0],
            opacity: [0, note.opacity, note.opacity, 0],
          }}
          transition={{
            duration: note.duration,
            delay: note.delay,
            repeat: Infinity,
            ease: "linear",
            times: [0, 0.15, 0.85, 1],
          }}
        >
          {note.glyph}
        </motion.span>
      ))}
    </div>
  );
}
