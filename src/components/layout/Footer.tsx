import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Instagram, Facebook, Youtube, Twitter } from "lucide-react";
import { NewsletterForm } from "@/components/NewsletterForm";
import { useVisitorCount } from "@/hooks/useVisitorCount";
import { getBookableEvents } from "@/lib/dataService";
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
];

const involvedLinks = [
  { name: "Join the choir", href: "/join" },
  { name: "Support the ministry", href: "/support" },
  { name: "Give", href: "/donate" },
  { name: "Member portal", href: "/member-portal" },
];

const socials = [
  { icon: Instagram, href: "https://www.instagram.com/theserenadesofpraise_group/", label: "Instagram" },
  { icon: Facebook, href: "https://web.facebook.com/profile.php?id=61558957757084", label: "Facebook" },
  { icon: Youtube, href: "https://www.youtube.com/@theserenadesofpraisegroup", label: "YouTube" },
  { icon: Twitter, href: "https://x.com/SerenadesTSC", label: "X (Twitter)" },
  { icon: SpotifyIcon, href: "https://open.spotify.com/user/31vkr3pk5yd5y2mpocfhibr4xbfm?si=R0-7_dXCRL2tlA84TP04TA", label: "Spotify" },
];

function FooterHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-6 text-[0.62rem] font-medium uppercase tracking-luxe text-primary">{children}</p>
  );
}

export function Footer() {
  const visitorCount = useVisitorCount();
  const [hasEvents, setHasEvents] = useState(false);

  useEffect(() => {
    getBookableEvents().then(events => setHasEvents(events.length > 0));
  }, []);

  return (
    <footer className="relative bg-background border-t border-foreground/[0.07] overflow-hidden">
      {/* Newsletter, set like a closing line in a concert programme */}
      <div className="container mx-auto px-4 lg:px-10 pt-24 pb-20">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="eyebrow mb-6">The Programme</p>
            <h2 className="display-lg text-foreground">
              Stay near the <span className="italic text-primary">music.</span>
            </h2>
          </div>
          <div className="lg:col-span-5">
            <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
              New releases, concert dates and ministry news. A few letters a year, never noise.
            </p>
            <NewsletterForm variant="inline" />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-10">
        <div className="hairline" />
      </div>

      <div className="container mx-auto px-4 lg:px-10 py-16">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-5 space-y-6">
            <Link to="/" className="inline-flex items-center gap-4">
              <span className="w-12 h-12 rounded-full overflow-hidden ring-1 ring-primary/40 ring-offset-2 ring-offset-background">
                <img src={logo} alt="Serenades of Praise Logo" className="w-full h-full object-cover" />
              </span>
              <span className="font-display text-2xl text-foreground leading-none">
                Serenades <span className="italic text-primary">of</span> Praise
              </span>
            </Link>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              A choir ministry of Kacyiru Seventh-day Adventist Church, lifting hearts through sacred music since 2024.
            </p>
            <div className="flex gap-2">
              {socials.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-10 h-10 rounded-full border border-foreground/10 flex items-center justify-center text-muted-foreground transition-colors duration-500 hover:border-primary hover:text-primary"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Explore */}
          <div className="md:col-span-2">
            <FooterHeading>Explore</FooterHeading>
            <ul className="space-y-3">
              {quickLinks
                .filter(link => link.name !== "Events" || hasEvents)
                .map((link) => (
                  <li key={link.name}>
                    <Link to={link.href} className="text-sm text-foreground/75 transition-colors hover:text-primary">
                      {link.name}
                    </Link>
                  </li>
                ))}
            </ul>
          </div>

          {/* Get involved */}
          <div className="md:col-span-2">
            <FooterHeading>Take part</FooterHeading>
            <ul className="space-y-3">
              {involvedLinks.map((link) => (
                <li key={link.name}>
                  <Link to={link.href} className="text-sm text-foreground/75 transition-colors hover:text-primary">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="col-span-2 md:col-span-3">
            <FooterHeading>Visit &amp; write</FooterHeading>
            <address className="not-italic space-y-3 text-sm text-foreground/75">
              <p>Kacyiru SDA Church<br />Kigali, Rwanda</p>
              <p>
                <a href="mailto:theserenadeschoir@gmail.com" className="transition-colors hover:text-primary">
                  theserenadeschoir@gmail.com
                </a>
              </p>
              <p>
                <a href="tel:+250780623144" className="tabular-nums transition-colors hover:text-primary">
                  +250 780 623 144
                </a>
              </p>
            </address>
          </div>
        </div>
      </div>

      {/* Oversized wordmark, cropped by the page edge */}
      <div aria-hidden className="pointer-events-none select-none px-4 lg:px-10">
        <p className="font-display italic leading-[0.8] text-foreground/[0.04] whitespace-nowrap text-center" style={{ fontSize: "clamp(4rem, 17vw, 17rem)" }}>
          Serenades
        </p>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-foreground/[0.07]">
        <div className="container mx-auto px-4 lg:px-10 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[0.68rem] uppercase tracking-[0.18em] text-muted-foreground">
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6">
            <p>© {new Date().getFullYear()} Serenades of Praise</p>
            {visitorCount > 0 && (
              <p className="tabular-nums">{visitorCount.toLocaleString()} visitors</p>
            )}
          </div>
          <div className="flex gap-6">
            <Link to="/privacy" className="transition-colors hover:text-primary">Privacy</Link>
            <Link to="/terms" className="transition-colors hover:text-primary">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
