import { Link } from "react-router-dom";
import { Instagram, Facebook, Youtube, Twitter, Mail, Phone, MapPin, Eye } from "lucide-react";
import { NewsletterForm } from "@/components/NewsletterForm";
import { useVisitorCount } from "@/hooks/useVisitorCount";
import logo from "@/assets/LogoTSC.jpg";

// Custom Spotify icon component
const SpotifyIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 168 168"
    className="w-4 h-4"
    fill="currentColor"
  >
    <path d="M84 0a84 84 0 1 0 84 84A84 84 0 0 0 84 0zm38.5 121.7c-1.3 1.9-3.5 2.5-5.4 1.2-14.8-9.1-33.4-11.1-55.1-6.1-2.1.5-4.3-1-4.8-3.1s1-4.3 3.1-4.8c25.2-6 46.4-3.7 63.4 6.6 1.9 1.3 2.5 3.5 1.2 5.4zm7.5-20.5c-1.6 2.4-4.7 3.1-7.1 1.5-17-10.6-42.8-13.7-62.9-7.5-2.6.7-5.4-.9-6.1-3.5s.9-5.4 3.5-6.1c23.8-6.4 52-3 71.7 8.1 2.4 1.6 3.1 4.7 1.5 7.5zm1.3-21.6c-19.5-12-51.6-13.1-70.9-7.2-3 .9-6.2-1-7.1-4s1-6.2 4-7.1c22.7-7.1 60.1-5.7 82.8 8.1 2.8 1.7 3.7 5.3 2 8.1s-5.3 3.7-8.1 2z" />
  </svg>
);

const quickLinks = [
  { name: "About", href: "/about" },
  { name: "Ministry", href: "/ministry" },
  { name: "Events", href: "/events" },
  { name: "Releases", href: "/releases" },
  { name: "Gallery", href: "/gallery" },
  { name: "Contact", href: "/contact" },
  { name: "Member Portal", href: "/member-portal" },
];

export function Footer() {
  const visitorCount = useVisitorCount();
  
  return (
    <footer className="bg-charcoal border-t border-primary/10">
      {/* Newsletter Section */}
      <div className="border-b border-primary/10">
        <div className="container mx-auto px-4 py-10">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="font-display text-2xl font-bold text-foreground mb-2">
              Stay <span className="gold-text">Connected</span>
            </h3>
            <p className="text-muted-foreground text-sm mb-6">
              Subscribe to receive updates on events, new releases, and ministry news.
            </p>
            <div className="max-w-md mx-auto">
              <NewsletterForm variant="inline" />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden">
                <img
                  src={logo}
                  alt="Serenades of Praise Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold gold-text">Serenades of Praise</h2>
                <p className="text-sm text-muted-foreground">Est. 2024</p>
              </div>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Lifting hearts through harmonious praise. A ministry dedicated to glorifying God through sacred music.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-display text-lg font-semibold text-foreground mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-display text-lg font-semibold text-foreground mb-4">
              Contact
            </h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                Kacyiru SDA Church, Kigali
              </li>
              <li>
                <a 
                  href="mailto:theserenadeschoir@gmail.com"
                  className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <Mail className="w-4 h-4 text-primary flex-shrink-0" />
                  theserenadeschoir@gmail.com
                </a>
              </li>
              <li>
                <a 
                  href="tel:+250780623144"
                  className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <Phone className="w-4 h-4 text-primary flex-shrink-0" />
                  +250 780 623 144
                </a>
              </li>
            </ul>
          </div>

          {/* Socials */}
          <div>
            <h3 className="font-display text-lg font-semibold text-foreground mb-4">
              Follow Us
            </h3>
            <div className="flex gap-3">
              {[
                { icon: Instagram, href: "https://www.instagram.com/theserenadesofpraise_group/", label: "Instagram" },
                { icon: Facebook, href: "https://web.facebook.com/profile.php?id=61558957757084", label: "Facebook" },
                { icon: Youtube, href: "https://www.youtube.com/@theserenadesofpraisegroup", label: "YouTube" },
                { icon: Twitter, href: "https://x.com/SerenadesTSC", label: "X (Twitter)" },
                { icon: SpotifyIcon, href: "https://open.spotify.com/user/31vkr3pk5yd5y2mpocfhibr4xbfm?si=R0-7_dXCRL2tlA84TP04TA", label: "Spotify" },
              ].map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-10 h-10 rounded-full border border-primary/30 flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
            <div className="mt-6 p-4 rounded-lg bg-secondary/50 border border-primary/10">
              <p className="text-xs text-muted-foreground">
                Member of <span className="text-primary">Kacyiru SDA Church</span>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-8 border-t border-primary/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Serenades of Praise Choir. All rights reserved.
            </p>
            {visitorCount > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Eye className="w-4 h-4 text-primary" />
                <span>{visitorCount.toLocaleString()} visitors</span>
              </div>
            )}
          </div>
          <div className="flex gap-6 text-sm">
            <Link to="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-muted-foreground hover:text-primary transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
