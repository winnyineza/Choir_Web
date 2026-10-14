import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { EASE_OUT } from "@/lib/motionPresets";
import choirImage from "@/assets/choir-group.jpg";

/** One headline line that rises out of a mask, the way type is revealed in film titles. */
function MaskLine({ children, delay, reduced }: { children: React.ReactNode; delay: number; reduced: boolean | null }) {
  return (
    <span className="block overflow-hidden pb-[0.08em]">
      <motion.span
        className="block"
        initial={reduced ? { opacity: 0 } : { y: "110%" }}
        animate={reduced ? { opacity: 1 } : { y: "0%" }}
        transition={{ duration: reduced ? 0.3 : 1.4, delay, ease: EASE_OUT }}
      >
        {children}
      </motion.span>
    </span>
  );
}

function FadeIn({ children, delay, className }: { children: React.ReactNode; delay: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.2, delay, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  );
}

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  // The photograph drifts slower than the type, so the hero gains depth as you scroll away.
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const smooth = useSpring(scrollYProgress, { stiffness: 90, damping: 26, mass: 0.4 });
  const bgY = useTransform(smooth, [0, 1], ["0%", "16%"]);
  const contentOpacity = useTransform(smooth, [0, 0.7], [1, 0]);
  // As you scroll away the type tips back into the scene, like a title card receding.
  const contentRotateX = useTransform(smooth, [0, 1], [0, 18]);
  const contentScale = useTransform(smooth, [0, 1], [1, 0.9]);
  const contentY = useTransform(smooth, [0, 1], ["0%", "-8%"]);

  // Pointer depth: the photograph and the type sit on separate planes and drift against each other.
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const pointerSpring = { stiffness: 60, damping: 20, mass: 0.8 };
  const imgX = useSpring(useTransform(px, (v) => v * -18), pointerSpring);
  const imgY = useSpring(useTransform(py, (v) => v * -12), pointerSpring);
  const imgRotY = useSpring(useTransform(px, (v) => v * 2.2), pointerSpring);
  const imgRotX = useSpring(useTransform(py, (v) => v * -1.6), pointerSpring);
  const typeX = useSpring(useTransform(px, (v) => v * 14), pointerSpring);
  const typeY = useSpring(useTransform(py, (v) => v * 8), pointerSpring);

  function handlePointerMove(event: React.PointerEvent<HTMLElement>) {
    if (reduced || event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    px.set((event.clientX - rect.left) / rect.width - 0.5);
    py.set((event.clientY - rect.top) / rect.height - 0.5);
  }

  function handlePointerLeave() {
    px.set(0);
    py.set(0);
  }

  return (
    <section
      ref={sectionRef}
      data-header-tone="dark"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="relative min-h-[100svh] flex flex-col justify-end overflow-hidden bg-ink text-[hsl(40_30%_91%)] [perspective:1200px]"
    >
      {/* Photograph settles in slowly on arrival, then floats on its own plane */}
      <motion.div className="absolute -inset-6" style={reduced ? undefined : { y: bgY }}>
        <motion.div
          className="h-full w-full"
          style={reduced ? undefined : { x: imgX, y: imgY, rotateX: imgRotX, rotateY: imgRotY }}
        >
        <motion.img
          src={choirImage}
          alt="Serenades of Praise Choir gathered outdoors in the hills of Rwanda"
          className="w-full h-full object-cover object-[50%_30%]"
          initial={reduced ? false : { scale: 1.12, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 2.6, ease: EASE_OUT }}
        />
        </motion.div>
      </motion.div>
      {/* Tonal grade: dark at the foot for type, a veil at the top for the nav */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,hsl(36_12%_4%/0.55)_0%,hsl(36_12%_4%/0.15)_30%,hsl(36_12%_4%/0.45)_62%,hsl(36_12%_4%/0.96)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,hsl(36_12%_4%/0.7)_0%,hsl(36_12%_4%/0.25)_45%,transparent_70%)]" />

      <motion.div
        className="relative z-10 container mx-auto px-4 lg:px-10 pt-40 pb-14 md:pb-20 origin-bottom"
        style={
          reduced
            ? undefined
            : { opacity: contentOpacity, rotateX: contentRotateX, scale: contentScale, y: contentY }
        }
      >
        <FadeIn delay={0.5} className="mb-8 md:mb-10">
          <p className="eyebrow !text-[hsl(40_45%_70%)]">Psalm 147 : 1</p>
        </FadeIn>

        <motion.h1 className="display-xl max-w-[14ch]" style={reduced ? undefined : { x: typeX, y: typeY }}>
          <MaskLine delay={0.6} reduced={reduced}>Sing songs</MaskLine>
          <MaskLine delay={0.75} reduced={reduced}>
            of <span className="italic text-[hsl(40_45%_68%)]">praise</span> to God.
          </MaskLine>
        </motion.h1>

        <div className="mt-12 md:mt-16 grid gap-10 md:grid-cols-12 md:items-end">
          <FadeIn delay={1.2} className="md:col-span-5">
            <p className="text-base md:text-lg font-light leading-relaxed text-[hsl(40_30%_91%/0.78)] max-w-md">
              A choir of Kacyiru Seventh-day Adventist Church, offering sacred music with reverence, discipline and joy.
            </p>
          </FadeIn>

          <FadeIn delay={1.35} className="md:col-span-7 flex flex-wrap items-center gap-x-10 gap-y-6 md:justify-end">
            <Button variant="hero" size="xl" asChild>
              <Link to="/releases">
                Listen to the choir
                <ArrowRight />
              </Link>
            </Button>
            <Link to="/events" className="link-luxe !text-[hsl(40_30%_91%/0.85)] hover:!text-[hsl(40_45%_70%)]">
              Upcoming concerts
              <span className="link-luxe-rule" />
            </Link>
          </FadeIn>
        </div>

        {/* Colophon strip */}
        <FadeIn delay={1.6} className="mt-16 md:mt-20 pt-6 border-t border-[hsl(40_30%_91%/0.14)]">
          <div className="flex flex-wrap items-center justify-between gap-4 text-[0.62rem] uppercase tracking-luxe text-[hsl(40_30%_91%/0.55)]">
            <span>Est. 2024</span>
            <span className="hidden sm:inline">Kacyiru SDA Church</span>
            <span className="hidden md:inline">Kigali, Rwanda</span>
            <span className="flex items-center gap-3">
              Scroll
              <span className="relative block h-8 w-px overflow-hidden bg-[hsl(40_30%_91%/0.15)]">
                {!reduced && (
                  <motion.span
                    className="absolute inset-x-0 top-0 h-1/2 bg-[hsl(40_45%_70%)]"
                    animate={{ y: ["-100%", "200%"] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                  />
                )}
              </span>
            </span>
          </div>
        </FadeIn>
      </motion.div>
    </section>
  );
}
