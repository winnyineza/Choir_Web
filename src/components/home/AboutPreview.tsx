import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Target, Eye, Heart, ArrowRight } from "lucide-react";
import { Reveal, Stagger, StaggerItem, TiltCard } from "@/components/motion";

const features = [
  {
    icon: Target,
    title: "Our Mission",
    description: "To spread the gospel through the ministry of sacred music, touching hearts and souls across Rwanda and beyond.",
  },
  {
    icon: Eye,
    title: "Our Vision",
    description: "To become a beacon of praise, inspiring communities through harmonious worship and spiritual devotion.",
  },
  {
    icon: Heart,
    title: "Our Values",
    description: "Unity, excellence, spirituality, and service guide everything we do in our musical ministry.",
  },
];

export function AboutPreview() {
  return (
    <section className="py-24 section-pattern relative overflow-hidden">
      {/* Decorative gradient orbs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <Stagger className="text-center mb-16" stagger={0.1}>
          <StaggerItem>
            <span className="inline-block text-primary text-sm font-semibold tracking-wider uppercase mb-4">
              Who We Are
            </span>
          </StaggerItem>
          <StaggerItem>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              About <span className="gold-text">The Serenades</span>
            </h2>
          </StaggerItem>
          <StaggerItem>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Founded on January 1st, 2024, we are a choir ministry dedicated to praising God through the beautiful gift of music at Kacyiru SDA Church.
            </p>
          </StaggerItem>
        </Stagger>

        {/* Feature Cards */}
        <Stagger className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12" stagger={0.12}>
          {features.map((feature) => (
            <StaggerItem key={feature.title}>
              <TiltCard className="card-glass rounded-2xl p-8 h-full group hover:border-primary/30 transition-colors duration-500">
                <div className="w-14 h-14 rounded-xl bg-[var(--gradient-gold)] flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-[var(--shadow-gold)] transition-all duration-300">
                  <feature.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </TiltCard>
            </StaggerItem>
          ))}
        </Stagger>

        <Reveal className="text-center" delay={0.1}>
          <Button variant="gold-outline" size="lg" asChild className="group">
            <Link to="/about">
              Learn More About Us
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1" />
            </Link>
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
