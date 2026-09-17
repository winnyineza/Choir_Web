import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { DURATION, EASE_OUT, pageVariants, staticVariants } from "@/lib/motionPresets";

export interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

/** Fades a route in on mount and out on unmount. Rendered per-route inside `AnimatePresence`. */
export function PageTransition({ children, className }: PageTransitionProps) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={reduced ? staticVariants : pageVariants}
      transition={{ duration: reduced ? 0.15 : DURATION.base, ease: EASE_OUT }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
