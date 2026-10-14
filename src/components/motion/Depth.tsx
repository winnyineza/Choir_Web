import { useRef, type ReactNode } from "react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { cn } from "@/lib/utils";

export interface DepthProps {
  children: ReactNode;
  className?: string;
  /** Degrees the layer is tipped back before it arrives. */
  tilt?: number;
  /** Scale the layer starts from. */
  from?: number;
}

/**
 * A 3D scroll reveal: the layer starts tipped away from the viewer and settles flat as it
 * reaches the middle of the screen, then leans gently the other way as it leaves.
 * Reads like a printed photograph being laid down on the page.
 */
export function Depth({ children, className, tilt = 14, from = 0.9 }: DepthProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const smooth = useSpring(scrollYProgress, { stiffness: 80, damping: 22, mass: 0.5 });

  const rotateX = useTransform(smooth, [0, 0.45, 1], [tilt, 0, -tilt * 0.35]);
  const scale = useTransform(smooth, [0, 0.45, 1], [from, 1, 0.98]);
  const y = useTransform(smooth, [0, 0.45, 1], [60, 0, -20]);
  const opacity = useTransform(smooth, [0, 0.2], [0.35, 1]);

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div ref={ref} className={cn("[perspective:1400px]", className)}>
      <motion.div
        style={{ rotateX, scale, y, opacity, transformOrigin: "50% 100%" }}
        className="will-change-transform [transform-style:preserve-3d]"
      >
        {children}
      </motion.div>
    </div>
  );
}
