import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Play, Calendar } from "lucide-react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { AnimatedCounter, FloatingNotes, PointerParallax } from "@/components/motion";
import { DURATION, EASE_OUT, revealVariants, staggerVariants, staticVariants } from "@/lib/motionPresets";
import choirImage from "@/assets/choir-group.jpg";

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  // Background drifts slower than the content, so the hero gains depth as you scroll away.
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const smooth = useSpring(scrollYProgress, { stiffness: 90, damping: 26, mass: 0.4 });
  const bgY = useTransform(smooth, [0, 1], ["0%", "18%"]);
  const bgScale = useTransform(smooth, [0, 1], [1, 1.12]);
  const contentY = useTransform(smooth, [0, 1], ["0%", "-12%"]);
  const contentOpacity = useTransform(smooth, [0, 0.8], [1, 0]);

  const item = reduced ? staticVariants : revealVariants("up");
  const itemTransition = { duration: reduced ? DURATION.fast : DURATION.slow, ease: EASE_OUT };

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Background Image with Dark Overlay */}
      <div className="absolute inset-0">
        <motion.img
          src={choirImage}
          alt="Serenades of Praise Choir"
          className="w-full h-full object-cover will-change-transform"
          style={reduced ? undefined : { y: bgY, scale: bgScale }}
        />
        <div className="absolute inset-0 bg-background/60" />
      </div>

      <FloatingNotes count={12} />

      {/* Content */}
      <motion.div
        className="relative z-10 container mx-auto px-4 pt-24 pb-16"
        style={reduced ? undefined : { y: contentY, opacity: contentOpacity }}
      >
        <motion.div
          className="max-w-4xl mx-auto text-center"
          initial="hidden"
          animate="visible"
          variants={staggerVariants(reduced ? 0.03 : 0.12)}
        >
          {/* Badge */}
          <motion.div
            variants={item}
            transition={itemTransition}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-background/40 backdrop-blur-sm border border-foreground/10 mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm font-medium tracking-widest uppercase text-foreground/80">Psalm 147:1</span>
          </motion.div>

          {/* Title */}
          <PointerParallax strength={10}>
            <motion.h1
              variants={item}
              transition={itemTransition}
              className="font-display text-5xl md:text-7xl lg:text-8xl font-semibold mb-6 leading-[0.95]"
            >
              <span className="text-foreground">Sing songs of</span>
              <br />
              <span className="text-primary italic">praise to God</span>
            </motion.h1>
          </PointerParallax>

          {/* Decorative Line */}
          <motion.div
            variants={item}
            transition={itemTransition}
            className="flex items-center justify-center gap-2 mb-8"
          >
            <motion.div
              className="h-0.5 bg-primary"
              initial={{ width: 0 }}
              animate={{ width: 64 }}
              transition={{ duration: reduced ? 0.15 : 0.7, delay: 0.5, ease: EASE_OUT }}
            />
            <div className="w-2 h-2 rounded-full bg-primary" />
            <motion.div
              className="h-0.5 bg-primary"
              initial={{ width: 0 }}
              animate={{ width: 64 }}
              transition={{ duration: reduced ? 0.15 : 0.7, delay: 0.5, ease: EASE_OUT }}
            />
          </motion.div>

          {/* Subtitle */}
          <motion.p
            variants={item}
            transition={itemTransition}
            className="text-lg md:text-xl text-foreground/70 max-w-xl mx-auto mb-12 leading-relaxed"
          >
            Experience divine connection through <span className="text-primary font-medium">powerful worship</span> and musical excellence that praises God.
          </motion.p>

          {/* Stats */}
          <motion.div
            variants={item}
            transition={itemTransition}
            className="flex items-center justify-center gap-12 md:gap-20 mb-12"
          >
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-foreground">
                <AnimatedCounter value={2} duration={1.2} />
                <span className="text-primary">+</span>
              </div>
              <div className="text-xs tracking-widest uppercase text-foreground/80 mt-1">Years in MISSION</div>
            </div>
            <div className="w-px h-12 bg-foreground/20" />
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-foreground">
                <AnimatedCounter value={2024} from={2000} duration={1.8} />
              </div>
              <div className="text-xs tracking-widest uppercase text-foreground/80 mt-1 font-normal">Founded</div>
            </div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            variants={item}
            transition={itemTransition}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button variant="gold" size="lg" asChild className="min-w-[180px]">
              <Link to="/events">
                <Calendar className="w-4 h-4 mr-2" />
                Upcoming Events
              </Link>
            </Button>
            <Link
              to="/about"
              className="text-foreground/70 hover:text-foreground transition-colors flex items-center gap-2 group"
            >
              Discover More
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
            <Link
              to="/releases"
              className="text-foreground/70 hover:text-foreground transition-colors flex items-center gap-2 group"
            >
              <Play className="w-4 h-4 transition-transform group-hover:scale-125" />
              Listen Now
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.6 }}
      >
        <div className="flex flex-col items-center gap-2 text-foreground/40">
          <motion.div
            className="w-px h-8 bg-gradient-to-b from-transparent via-foreground/30 to-foreground/50"
            animate={reduced ? undefined : { scaleY: [0.4, 1, 0.4], opacity: [0.3, 1, 0.3] }}
            style={{ originY: 0 }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </motion.div>
    </section>
  );
}
