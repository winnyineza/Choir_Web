import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";
import {
  DURATION,
  EASE_OUT,
  revealVariants,
  staticVariants,
  type RevealDirection,
} from "@/lib/motionPresets";

export interface RevealProps extends Omit<HTMLMotionProps<"div">, "variants" | "initial" | "animate"> {
  /** Where the element travels in from. */
  direction?: RevealDirection;
  /** Multiplier on the travel distance, for subtler or bolder entrances. */
  distance?: number;
  delay?: number;
  duration?: number;
  /** Replay every time the element scrolls back into view. */
  repeat?: boolean;
  /** Fraction of the element that must be visible before it animates. */
  amount?: number;
  blur?: boolean;
}

/** Fades and slides its children in once they scroll into view. */
export function Reveal({
  direction = "up",
  distance = 1,
  delay = 0,
  duration = DURATION.slow,
  repeat = false,
  amount = 0.2,
  blur = true,
  children,
  ...props
}: RevealProps) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: !repeat, amount, margin: "0px 0px -80px 0px" }}
      variants={reduced ? staticVariants : revealVariants(direction, distance, blur)}
      transition={{ duration: reduced ? DURATION.fast : duration, delay, ease: EASE_OUT }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
