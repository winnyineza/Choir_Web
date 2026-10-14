import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { EASE_OUT } from "@/lib/motionPresets";
import { Reveal } from "@/components/motion";

/**
 * Shared pieces of the "cathedral editorial" look: numbered section heads, a scripture marquee
 * and the hero used at the top of inner pages. Keeping them here means every page speaks the same language.
 */

export interface SectionHeadProps {
  /** Roman numeral or short index shown before the eyebrow, e.g. "II". */
  index?: string;
  eyebrow: string;
  title: ReactNode;
  lede?: ReactNode;
  align?: "left" | "center" | "split";
  className?: string;
  action?: ReactNode;
}

export function SectionHead({ index, eyebrow, title, lede, align = "left", className, action }: SectionHeadProps) {
  if (align === "split") {
    return (
      <div className={cn("grid gap-10 lg:grid-cols-12 lg:items-end mb-16 md:mb-20", className)}>
        <Reveal className="lg:col-span-7">
          <p className="mb-6 flex items-center gap-4 text-[0.65rem] uppercase tracking-luxe text-primary">
            {index && <span className="font-display text-base normal-case tracking-normal italic">{index}</span>}
            <span className="h-px w-8 bg-primary/60" />
            {eyebrow}
          </p>
          <h2 className="display-lg text-foreground">{title}</h2>
        </Reveal>
        <Reveal className="lg:col-span-5 lg:pb-3" delay={0.12}>
          {lede && <p className="lede">{lede}</p>}
          {action && <div className="mt-8">{action}</div>}
        </Reveal>
      </div>
    );
  }

  const centered = align === "center";
  return (
    <Reveal className={cn("mb-16 md:mb-20", centered && "text-center mx-auto max-w-3xl", className)}>
      <p
        className={cn(
          "mb-6 flex items-center gap-4 text-[0.65rem] uppercase tracking-luxe text-primary",
          centered && "justify-center"
        )}
      >
        {index && <span className="font-display text-base normal-case tracking-normal italic">{index}</span>}
        <span className="h-px w-8 bg-primary/60" />
        {eyebrow}
        {centered && <span className="h-px w-8 bg-primary/60" />}
      </p>
      <h2 className="display-lg text-foreground">{title}</h2>
      {lede && <p className={cn("lede mt-6", centered && "mx-auto")}>{lede}</p>}
      {action && <div className="mt-8">{action}</div>}
    </Reveal>
  );
}

/** Slow, endless line of scripture between sections. */
export function ScriptureMarquee({ items, className }: { items: string[]; className?: string }) {
  const reduced = useReducedMotion();
  const row = (
    <div className="flex shrink-0 items-center">
      {items.map((item, i) => (
        <span key={i} className="flex items-center">
          <span className="px-8 md:px-12 font-display text-3xl md:text-5xl italic text-foreground/85 whitespace-nowrap">
            {item}
          </span>
          <span className="text-primary text-xl" aria-hidden>✦</span>
        </span>
      ))}
    </div>
  );

  return (
    <div
      className={cn("relative overflow-hidden border-y border-foreground/[0.07] py-8 md:py-10", className)}
      aria-label={items.join(". ")}
    >
      <div className={cn("flex w-max", !reduced && "animate-marquee")} aria-hidden>
        {row}
        {row}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent" />
    </div>
  );
}

export interface PageHeroProps {
  eyebrow: string;
  title: ReactNode;
  lede?: ReactNode;
  /** Optional photograph shown full-bleed behind the title. */
  image?: string;
  imageAlt?: string;
  children?: ReactNode;
  className?: string;
}

/** Opening spread for inner pages: generous space, a serif title, and an optional photograph. */
export function PageHero({ eyebrow, title, lede, image, imageAlt = "", children, className }: PageHeroProps) {
  const reduced = useReducedMotion();

  return (
    <section
      data-header-tone={image ? "dark" : undefined}
      className={cn(
        "relative overflow-hidden",
        image ? "min-h-[78svh] flex items-end bg-ink text-[hsl(40_30%_91%)]" : "pt-40 md:pt-48 pb-16 md:pb-24",
        className
      )}
    >
      {image && (
        <>
          <motion.img
            src={image}
            alt={imageAlt}
            className="absolute inset-0 h-full w-full object-cover"
            initial={reduced ? false : { scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 2.4, ease: EASE_OUT }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,hsl(36_12%_4%/0.6)_0%,hsl(36_12%_4%/0.2)_35%,hsl(36_12%_4%/0.92)_100%)]" />
        </>
      )}

      <div className={cn("relative z-10 container mx-auto px-4 lg:px-10", image && "pt-40 pb-16 md:pb-20")}>
        <motion.p
          className={cn("eyebrow mb-8", image && "!text-[hsl(40_45%_70%)]")}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.2, ease: EASE_OUT }}
        >
          {eyebrow}
        </motion.p>
        <h1 className="display-xl max-w-[16ch]">
          <span className="block overflow-hidden pb-[0.08em]">
            <motion.span
              className="block"
              initial={reduced ? { opacity: 0 } : { y: "105%" }}
              animate={reduced ? { opacity: 1 } : { y: "0%" }}
              transition={{ duration: 1.3, delay: 0.3, ease: EASE_OUT }}
            >
              {title}
            </motion.span>
          </span>
        </h1>
        {(lede || children) && (
          <motion.div
            className="mt-10 md:mt-12 grid gap-8 md:grid-cols-12 md:items-end"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, delay: 0.7, ease: EASE_OUT }}
          >
            {lede && (
              <p
                className={cn(
                  "md:col-span-6 text-base md:text-lg font-light leading-relaxed",
                  image ? "text-[hsl(40_30%_91%/0.78)]" : "text-muted-foreground"
                )}
              >
                {lede}
              </p>
            )}
            {children && <div className="md:col-span-6 md:justify-self-end">{children}</div>}
          </motion.div>
        )}
        <div className={cn("mt-14 md:mt-20 h-px", image ? "bg-[hsl(40_30%_91%/0.14)]" : "bg-foreground/[0.08]")} />
      </div>
    </section>
  );
}
