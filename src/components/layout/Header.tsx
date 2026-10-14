import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion, useScroll, useSpring } from "motion/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EASE_OUT } from "@/lib/motionPresets";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getBookableEvents } from "@/lib/dataService";
import logo from "@/assets/LogoTSC.jpg";
import { MELODIES_OF_GRACE, isMelodiesUpcoming } from "@/lib/melodiesOfGrace";

const baseNavLinks = [
  { name: "About", href: "/about" },
  { name: "Ministry", href: "/ministry" },
  { name: "Events", href: "/events", requiresEvents: true },
  { name: "Releases", href: "/releases" },
  { name: "Gallery", href: "/gallery" },
  { name: "Contact", href: "/contact" },
];

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [onDark, setOnDark] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hasEvents, setHasEvents] = useState(false);
  const lastY = useRef(0);
  const location = useLocation();
  const reduced = useReducedMotion();

  // Hairline under the header showing how far down the page you are.
  const { scrollYProgress } = useScroll();
  const readingProgress = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.3 });

  // The bar condenses once you leave the top, steps aside while you read down, and returns when you scroll up.
  useEffect(() => {
    // Is the bar currently over a section that stays dark in both themes (a hero photograph)?
    const checkTone = () => {
      const probe = 40;
      const dark = Array.from(document.querySelectorAll<HTMLElement>('[data-header-tone="dark"]')).some((el) => {
        const rect = el.getBoundingClientRect();
        return rect.top <= probe && rect.bottom >= probe;
      });
      setOnDark(dark);
    };

    const handleScroll = () => {
      checkTone();
      const y = window.scrollY;
      setIsScrolled(y > 24);
      setIsHidden(y > 320 && y > lastY.current + 4);
      if (y < lastY.current - 4 || y <= 320) setIsHidden(false);
      lastY.current = y;
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    // Pages load lazily and animate in, so look again once the new page has had time to render.
    const timers = [80, 400, 1000].map((ms) => window.setTimeout(checkTone, ms));
    return () => {
      window.removeEventListener("scroll", handleScroll);
      timers.forEach(window.clearTimeout);
    };
  }, [location.pathname]);

  // Check if there are any bookable events
  useEffect(() => {
    const checkEvents = async () => {
      const events = await getBookableEvents();
      setHasEvents(events.length > 0);
    };
    checkEvents();

    // Listen for event updates
    const handler = () => { checkEvents(); };
    window.addEventListener("eventsUpdated", handler);
    const interval = setInterval(checkEvents, 60000); // Re-check every minute
    return () => {
      window.removeEventListener("eventsUpdated", handler);
      clearInterval(interval);
    };
  }, []);

  // Lock page scroll behind the full-screen menu.
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isMobileMenuOpen]);

  useEffect(() => { setIsMobileMenuOpen(false); }, [location.pathname]);

  // Filter nav links based on whether events exist
  const navLinks = useMemo(() => {
    const links = baseNavLinks.filter(link => !link.requiresEvents || hasEvents);
    // Spotlight the upcoming concert in the menu until it has happened.
    return isMelodiesUpcoming()
      ? [{ name: "Concert", href: MELODIES_OF_GRACE.path }, ...links]
      : links;
  }, [hasEvents]);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-[transform,background-color,padding,border-color] duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] border-b",
        isScrolled
          ? "bg-background/80 border-foreground/[0.06] py-3"
          : "bg-gradient-to-b from-background/70 to-transparent border-transparent py-6",
        // backdrop-filter would trap the fixed full-screen menu inside the header, so drop it while open.
        isScrolled && !isMobileMenuOpen && "backdrop-blur-md",
        isHidden && !isMobileMenuOpen && "-translate-y-full",
        onDark && !isMobileMenuOpen && "tone-dark"
      )}
    >
      <div className="container mx-auto px-4 lg:px-10 flex items-center justify-between gap-6">
        {/* Wordmark */}
        <Link to="/" className="flex items-center gap-3.5 group shrink-0" aria-label="Serenades of Praise, home">
          <span className="w-9 h-9 rounded-full overflow-hidden ring-1 ring-primary/40 ring-offset-2 ring-offset-background transition-[box-shadow] duration-700 group-hover:ring-primary">
            <img src={logo} alt="" className="w-full h-full object-cover" />
          </span>
          <span className="hidden sm:flex flex-col leading-none">
            <span className="font-display text-[1.35rem] text-foreground tracking-[-0.01em]">
              Serenades <span className="italic text-primary">of</span> Praise
            </span>
            <span className="mt-1 text-[0.58rem] uppercase tracking-luxe text-muted-foreground">
              Kacyiru SDA · Kigali
            </span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-9" aria-label="Main">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.href;
            return (
              <Link
                key={link.name}
                to={link.href}
                data-active={isActive}
                className={cn(
                  "link-underline text-[0.68rem] font-medium uppercase tracking-[0.22em] transition-colors duration-500",
                  isActive ? "text-primary" : "text-foreground/70 hover:text-foreground"
                )}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
          <Button variant="gold" size="sm" asChild>
            <Link to="/donate">Give</Link>
          </Button>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="lg:hidden relative z-[60] -mr-2 flex h-10 w-10 flex-col items-center justify-center gap-[7px]"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMobileMenuOpen}
        >
          <span
            className={cn(
              "block h-px w-6 bg-foreground transition-transform duration-500",
              isMobileMenuOpen && "translate-y-[4px] rotate-45"
            )}
          />
          <span
            className={cn(
              "block h-px w-6 bg-foreground transition-transform duration-500",
              isMobileMenuOpen && "-translate-y-[4px] -rotate-45"
            )}
          />
        </button>
      </div>

      {/* Full-screen mobile menu */}
      <AnimatePresence initial={false}>
        {isMobileMenuOpen && (
          <motion.div
            key="mobile-menu"
            className="lg:hidden fixed inset-0 z-[55] bg-background flex flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0.12 : 0.5, ease: EASE_OUT }}
          >
            <motion.nav
              className="flex-1 container mx-auto px-6 flex flex-col justify-center gap-1"
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: reduced ? 0 : 0.06, delayChildren: 0.1 } } }}
              aria-label="Mobile"
            >
              {navLinks.map((link, index) => (
                <motion.div
                  key={link.name}
                  variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }}
                  transition={{ duration: 0.8, ease: EASE_OUT }}
                  className="border-b border-foreground/[0.07]"
                >
                  <Link
                    to={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-baseline gap-5 py-4 font-display text-4xl transition-colors",
                      location.pathname === link.href ? "text-primary italic" : "text-foreground"
                    )}
                  >
                    <span className="font-body text-[0.65rem] tracking-[0.2em] text-muted-foreground tabular-nums">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {link.name}
                  </Link>
                </motion.div>
              ))}
            </motion.nav>
            <motion.div
              className="container mx-auto px-6 pb-10 flex items-center justify-between gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <ThemeToggle className="h-12 w-12 border border-foreground/15" />
              <Button variant="gold" size="lg" asChild className="min-w-0 flex-1 sm:flex-none">
                <Link to="/donate" onClick={() => setIsMobileMenuOpen(false)}>Give</Link>
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reading progress */}
      <motion.div
        className="absolute bottom-[-1px] left-0 right-0 h-px origin-left bg-primary/70"
        style={{ scaleX: readingProgress }}
        aria-hidden
      />
    </header>
  );
}
