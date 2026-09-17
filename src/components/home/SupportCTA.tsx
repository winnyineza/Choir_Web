import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Heart, ArrowRight } from "lucide-react";
import { Reveal, Stagger, StaggerItem, TiltCard } from "@/components/motion";

export function SupportCTA() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background with pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gold-gradient opacity-10" />
        <div className="absolute inset-0 bg-background/90" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Icon */}
          <Reveal direction="none" duration={0.6}>
            <div className="w-20 h-20 rounded-full bg-gold-gradient mx-auto mb-8 flex items-center justify-center animate-pulse-gold">
              <Heart className="w-10 h-10 text-primary-foreground" />
            </div>
          </Reveal>

          <Stagger stagger={0.12}>
            <StaggerItem>
              <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                Support Our <span className="gold-text">Ministry</span>
              </h2>
            </StaggerItem>
            <StaggerItem>
              <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
                Your generous support helps us continue spreading the gospel through music, reaching more hearts, and expanding our ministry across Rwanda.
              </p>
            </StaggerItem>
          </Stagger>

          {/* Support Options */}
          <Stagger className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-8xl mx-auto mb-10" stagger={0.14}>
            <StaggerItem direction="right">
              <TiltCard maxTilt={6} className="card-glass rounded-2xl p-6 text-left h-full hover:border-primary/30 transition-colors duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[#8B0000] flex items-center justify-center">
                    <span className="text-white font-bold text-sm">EQ</span>
                  </div>
                  <div className="text-left">
                    <span className="text-[#8B0000] font-bold text-xs">EQUITY</span>
                    <span className="block text-muted-foreground text-xs">BANK</span>
                  </div>
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                  Equity Bank Transfer
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Easy direct way to support, through bank transfer for any contribution.
                </p>
                <div className="bg-secondary/50 rounded-lg p-2">
                  <p className="text-base text-muted-foreground">Account Number</p>
                  <p className="text-foreground font-mono font-semibold text-lg">4024212955253</p>
                </div>
              </TiltCard>
            </StaggerItem>

            <StaggerItem direction="left">
              <TiltCard maxTilt={6} className="card-glass rounded-2xl p-6 text-left h-full hover:border-primary/30 transition-colors duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[#FFCC00] flex items-center justify-center">
                    <span className="text-black font-bold text-sm">MTN</span>
                  </div>
                  <div className="text-left">
                    <span className="text-[#FFCC00] font-bold text-xs">MTN</span>
                    <span className="block text-muted-foreground text-xs">Mobile Money</span>
                  </div>
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                  MTN Mobile Money
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Quick and easy supporting way, through MTN mobile money support.
                </p>
                <div className="bg-secondary/50 rounded-lg p-2">
                  <p className="text-base text-muted-foreground">MoMo Number</p>
                  <p className="text-foreground font-mono font-semibold text-lg">(+250)798 254 683</p>
                  <p className="text-[#FFCC00] text-foreground font-mono font-semibold text-base">Acc.Name: Irakoze Alysee</p>
                </div>
              </TiltCard>
            </StaggerItem>
          </Stagger>

          <Reveal delay={0.1}>
            <Button variant="hero" size="xl" asChild className="group">
              <Link to="/support">
                Support Now
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1" />
              </Link>
            </Button>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
