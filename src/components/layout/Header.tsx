import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Info, Users, Calendar, Music, Image, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSelector } from "@/components/LanguageSelector";
import logo from "@/assets/LogoTSC.jpg"; // <-- your logo import

const navLinks = [
  { name: "About", href: "/about", icon: Info },
  { name: "Ministry", href: "/ministry", icon: Users },
  { name: "Events", href: "/events", icon: Calendar },
  { name: "Releases", href: "/releases", icon: Music },
  { name: "Gallery", href: "/gallery", icon: Image },
  { name: "Contact", href: "/contact", icon: Mail },
];

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
          <div className="w-10 h-10 rounded-xl overflow-hidden">
            <img
              src={logo}
              alt="Serenades of Praise Logo"
              className="w-full h-full object-cover"
            />
          </div>
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
            return (
              <Link
                key={link.name}
                to={link.href}
                className={cn(
                  "px-4 py-2 text-sm font-medium transition-all duration-300 rounded-lg flex items-center gap-2",
                  location.pathname === link.href
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <IconComponent className="w-4 h-4" />
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* CTA Buttons */}
        <div className="hidden md:flex items-center gap-2">
          <LanguageSelector />
          <ThemeToggle />
          <Button variant="gold-outline" size="sm" asChild>
            <Link to="/join">Join Choir</Link>
          </Button>
          <Button variant="gold" size="sm" asChild>
            <Link to="/support">Support Us</Link>
          </Button>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="lg:hidden p-2 text-foreground hover:text-primary transition-colors"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={cn(
          "lg:hidden absolute top-full left-0 right-0 bg-background/95 backdrop-blur-xl border-b border-primary/10 overflow-hidden transition-all duration-300",
          isMobileMenuOpen ? "max-h-96 py-4" : "max-h-0"
        )}
      >
        <nav className="container mx-auto px-4 flex flex-col gap-2">
          {navLinks.map((link, index) => {
            const IconComponent = link.icon;
            return (
              <Link
                key={link.name}
                to={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "px-4 py-3 text-base font-medium transition-all duration-300 rounded-lg flex items-center gap-3",
                  location.pathname === link.href
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <IconComponent className="w-5 h-5" />
                {link.name}
              </Link>
            );
          })}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-primary/10">
            <div className="flex items-center gap-2">
              <LanguageSelector />
              <ThemeToggle />
            </div>
            <div className="flex gap-2">
              <Button variant="gold-outline" size="sm" asChild>
                <Link to="/join" onClick={() => setIsMobileMenuOpen(false)}>Join</Link>
              </Button>
              <Button variant="gold" size="sm" asChild>
                <Link to="/support" onClick={() => setIsMobileMenuOpen(false)}>Support</Link>
              </Button>
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}
