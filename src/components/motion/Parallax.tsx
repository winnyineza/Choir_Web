import { useRef, type ReactNode } from "react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";

export interface ParallaxProps {
  children: ReactNode;
  className?: string;
  /**
   * Pixels the layer drifts across the full scroll pass.
   * Negative values move against the scroll, which reads as "further away".
   */
  distance?: number;
  /** Also fade the layer out as it leaves the viewport. */
  fade?: boolean;
  /** Scale the layer up slightly while it is in view. */
  zoom?: number;
}

/** Moves its children at a different rate than the page scroll to fake depth. */
export function Parallax({
  children,
  className,
  distance = 80,
  fade = false,
  zoom = 1,
}: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const smooth = useSpring(scrollYProgress, { stiffness: 90, damping: 24, mass: 0.4 });

  const y = useTransform(smooth, [0, 1], [distance, -distance]);
  const opacity = useTransform(smooth, [0, 0.25, 0.75, 1], [0, 1, 1, 0]);
  const scale = useTransform(smooth, [0, 0.5, 1], [1, zoom, 1]);

  return (
    <div ref={ref} className={className}>
      <motion.div
        style={
          reduced
            ? undefined
            : { y, opacity: fade ? opacity : undefined, scale: zoom !== 1 ? scale : undefined }
        }
        className="will-change-transform"
      >
        {children}
      </motion.div>
    </div>
  );
}

/** Tracks the pointer and shifts children a few pixels, giving a subtle 3D feel. */
export function PointerParallax({
  children,
  className,
  strength = 12,
}: {
  children: ReactNode;
  className?: string;
  strength?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  const x = useSpring(0, { stiffness: 120, damping: 20 });
  const y = useSpring(0, { stiffness: 120, damping: 20 });

  function handleMove(event: React.PointerEvent<HTMLDivElement>) {
    if (reduced || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set(((event.clientX - rect.left) / rect.width - 0.5) * strength * 2);
    y.set(((event.clientY - rect.top) / rect.height - 0.5) * strength * 2);
  }

  return (
    <div
      ref={ref}
      className={className}
      onPointerMove={handleMove}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      <motion.div style={reduced ? undefined : { x, y }} className="will-change-transform">
        {children}
      </motion.div>
    </div>
  );
}
