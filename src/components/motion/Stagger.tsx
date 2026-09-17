import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";
import {
  DURATION,
  EASE_OUT,
  revealVariants,
  staggerVariants,
  staticVariants,
  type RevealDirection,
} from "@/lib/motionPresets";

export interface StaggerProps extends Omit<HTMLMotionProps<"div">, "variants" | "initial"> {
  /** Gap in seconds between each child's entrance. */
  stagger?: number;
  delay?: number;
  repeat?: boolean;
  amount?: number;
}

/**
 * Wraps a list so its `StaggerItem` children enter one after another.
 * Pair with `StaggerItem`; plain children will not animate.
 */
export function Stagger({
  stagger = 0.08,
  delay = 0,
  repeat = false,
  amount = 0.15,
  children,
  ...props
}: StaggerProps) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: !repeat, amount, margin: "0px 0px -60px 0px" }}
      variants={staggerVariants(reduced ? 0.03 : stagger, delay)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export interface StaggerItemProps extends Omit<HTMLMotionProps<"div">, "variants" | "initial" | "animate"> {
  direction?: RevealDirection;
  distance?: number;
  duration?: number;
  blur?: boolean;
}

/** A single row/card inside a `Stagger` group. */
export function StaggerItem({
  direction = "up",
  distance = 1,
  duration = DURATION.base,
  blur = true,
  children,
  ...props
}: StaggerItemProps) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      variants={reduced ? staticVariants : revealVariants(direction, distance, blur)}
      transition={{ duration: reduced ? DURATION.fast : duration, ease: EASE_OUT }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
