import { useRef, type ReactNode } from "react";
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { cn } from "@/lib/utils";

export interface TiltCardProps {
  children: ReactNode;
  className?: string;
  /** Maximum rotation in degrees at the corners of the card. */
  maxTilt?: number;
  /** How far the card lifts toward the viewer on hover, in pixels. */
  lift?: number;
  /** Draw a light sheen that follows the pointer. */
  glare?: boolean;
}

/**
 * Tilts in 3D toward the pointer, with an optional sheen that tracks the cursor.
 * Falls back to a plain container when the visitor prefers reduced motion.
 */
export function TiltCard({
  children,
  className,
  maxTilt = 8,
  lift = 12,
  glare = true,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  // Pointer position as a percentage across the card, used to place the sheen.
  const px = useMotionValue(50);
  const py = useMotionValue(50);
  const hovered = useMotionValue(0);

  const spring = { stiffness: 220, damping: 22, mass: 0.6 };
  const rotateX = useSpring(useMotionValue(0), spring);
  const rotateY = useSpring(useMotionValue(0), spring);
  const translateZ = useSpring(useMotionValue(0), spring);
  const glareOpacity = useSpring(hovered, { stiffness: 160, damping: 24 });

  const glareBackground = useMotionTemplate`radial-gradient(circle at ${px}% ${py}%, hsl(45 90% 70% / 0.45), transparent 55%)`;

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (reduced || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const relX = (event.clientX - rect.left) / rect.width - 0.5;
    const relY = (event.clientY - rect.top) / rect.height - 0.5;
    px.set(Math.round((relX + 0.5) * 100));
    py.set(Math.round((relY + 0.5) * 100));
    rotateY.set(relX * maxTilt * 2);
    rotateX.set(-relY * maxTilt * 2);
  }

  function handlePointerEnter() {
    if (reduced) return;
    hovered.set(1);
    translateZ.set(lift);
  }

  function handlePointerLeave() {
    hovered.set(0);
    rotateX.set(0);
    rotateY.set(0);
    translateZ.set(0);
  }

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div style={{ perspective: 1000 }} className="[transform-style:preserve-3d]">
      <motion.div
        ref={ref}
        onPointerMove={handlePointerMove}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        style={{ rotateX, rotateY, translateZ, transformStyle: "preserve-3d" }}
        className={cn("relative will-change-transform", className)}
      >
        {children}
        {glare && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[inherit] mix-blend-soft-light"
            style={{ opacity: glareOpacity, background: glareBackground }}
          />
        )}
      </motion.div>
    </div>
  );
}
