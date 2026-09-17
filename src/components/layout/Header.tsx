import { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion, useScroll, useSpring } from "motion/react";
import { Button } from "@/components/ui/button";
import { Menu, X, Info, Users, Calendar, Music, Image, Mail, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { EASE_OUT } from "@/lib/motionPresets";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getBookableEvents } from "@/lib/dataService";
import logo from "@/assets/LogoTSC.jpg";

const baseNavLinks = [
  { name: "About", href: "/about", icon: Info },
  { name: "Ministry", href: "/ministry", icon: Users },
  { name: "Events", href: "/events", icon: Calendar, requiresEvents: true },
  { name: "Releases", href: "/releases", icon: Music },
  { name: "Gallery", href: "/gallery", icon: Image },
  { name: "Contact", href: "/contact", icon: Mail },
];

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hasEvents, setHasEvents] = useState(false);
  const location = useLocation();
  const reduced = useReducedMotion();

  // Thin bar under the header showing how far down the page you are.
  const { scrollYProgress } = useScroll();
  const readingProgress = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.3 });

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  // Filter nav links based on whether events exist
  const navLinks = useMemo(() => {
    return baseNavLinks.filter(link => !link.requiresEvents || hasEvents);
  }, [hasEvents]);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        isScrolled
          ? "bg-background/60 backdrop-blur-xl border-b border-primary/10 py-3"
          : "bg-transparent py-5"
      )}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <motion.div
            className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-primary/30 shadow-[0_0_18px_hsl(var(--gold)/0.25)]"
            whileHover={reduced ? undefined : { rotate: 8, scale: 1.08 }}
            whileTap={reduced ? undefined : { scale: 0.94 }}
            transition={{ type: "spring", stiffness: 400, damping: 18 }}
          >
            <img
              src={logo}
              alt="Serenades of Praise Logo"
              className="w-full h-full object-cover"
            />
          </motion.div>
          <div className="hidden sm:block">
            <h1 className="font-body text-base font-bold text-foreground">
              Serenades of Praise
            </h1>
            <p className="text-xs text-muted-foreground">Voices United in Worship</p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => {
            const IconComponent = link.icon;
            const isActive = location.pathname === link.href;
            return (
              <Link
                key={link.name}
                to={link.href}
                className={cn(
                  "relative px-4 py-2 text-sm font-medium transition-colors duration-300 rounded-lg flex items-center gap-2 group",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {/* The highlight glides between links instead of blinking on and off. */}
                {isActive && (
                  <motion.span
                    layoutId="nav-active-pill"
                    className="absolute inset-0 rounded-lg bg-primary/10"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <IconComponent className="relative w-4 h-4 transition-transform duration-300 group-hover:-translate-y-0.5" />
                <span className="relative">{link.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* CTA Buttons */}
        <div className="hidden md:flex items-center gap-2">
          <ThemeToggle />
          <Button variant="gold" size="sm" asChild>
            <Link to="/donate">
              <Heart className="w-4 h-4 mr-1" />
              Donate
            </Link>
          </Button>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="lg:hidden p-2 text-foreground hover:text-primary transition-colors"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMobileMenuOpen}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={isMobileMenuOpen ? "close" : "open"}
              className="block"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.18, ease: EASE_OUT }}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </motion.span>
          </AnimatePresence>
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence initial={false}>
        {isMobileMenuOpen && (
          <motion.div
            key="mobile-menu"
            className="lg:hidden absolute top-full left-0 right-0 bg-background/95 backdrop-blur-xl border-b border-primary/10 overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduced ? 0.12 : 0.32, ease: EASE_OUT }}
          >
            <motion.nav
              className="container mx-auto px-4 flex flex-col gap-2 py-4"
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: reduced ? 0 : 0.05, delayChildren: 0.06 } } }}
            >
              {navLinks.map((link) => {
                const IconComponent = link.icon;
                return (
                  <motion.div
                    key={link.name}
                    variants={{ hidden: { opacity: 0, x: -16 }, visible: { opacity: 1, x: 0 } }}
                    transition={{ duration: 0.3, ease: EASE_OUT }}
                  >
                    <Link
                      to={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "px-4 py-3 text-base font-medium transition-all duration-300 rounded-lg flex items-center gap-3",
                        location.pathname === link.href
                          ? "text-primary bg-primary/10"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                      )}
                    >
                      <IconComponent className="w-5 h-5" />
                      {link.name}
                    </Link>
                  </motion.div>
                );
              })}
              <motion.div
                className="flex items-center justify-between mt-4 pt-4 border-t border-primary/10"
                variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.3, ease: EASE_OUT }}
              >
                <ThemeToggle />
                <Button variant="gold" size="sm" asChild>
                  <Link to="/donate" onClick={() => setIsMobileMenuOpen(false)}>Donate</Link>
                </Button>
              </motion.div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reading progress */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-0.5 origin-left bg-gradient-to-r from-primary/40 via-primary to-primary/40"
        style={{ scaleX: readingProgress }}
        aria-hidden
      />
    </header>
  );
}
