import type { Transition, Variants } from "motion/react";

/** Shared easing curve so every animation in the app feels like it came from the same place. */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;
export const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const;

export const DURATION = {
  fast: 0.25,
  base: 0.5,
  slow: 0.8,
} as const;

export const springSoft: Transition = { type: "spring", stiffness: 260, damping: 26, mass: 0.9 };
export const springSnappy: Transition = { type: "spring", stiffness: 420, damping: 30, mass: 0.6 };

export type RevealDirection = "up" | "down" | "left" | "right" | "none";

const OFFSET: Record<RevealDirection, { x: number; y: number }> = {
  up: { x: 0, y: 32 },
  down: { x: 0, y: -32 },
  left: { x: 40, y: 0 },
  right: { x: -40, y: 0 },
  none: { x: 0, y: 0 },
};

export function revealVariants(
  direction: RevealDirection = "up",
  distance = 1,
  blur = true
): Variants {
  const { x, y } = OFFSET[direction];
  return {
    hidden: {
      opacity: 0,
      x: x * distance,
      y: y * distance,
      filter: blur ? "blur(6px)" : "blur(0px)",
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      filter: "blur(0px)",
    },
  };
}

/** Parent variant that walks its children in one after another. */
export function staggerVariants(stagger = 0.08, delayChildren = 0): Variants {
  return {
    hidden: {},
    visible: {
      transition: { staggerChildren: stagger, delayChildren },
    },
  };
}

/** Variants with no movement, used when the visitor asked for reduced motion. */
export const staticVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

/** Whole-page enter/exit used by route transitions. */
export const pageVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};
