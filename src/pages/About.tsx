import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Target, Eye, Heart, Users, Calendar, Award, Music } from "lucide-react";
import choirImage from "@/assets/choir-group.jpg";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { AnimatedCounter, Reveal, Stagger, StaggerItem, TiltCard } from "@/components/motion";

const milestones = [
  { year: "2024", title: "Founded", description: "Serenades of Praise was born at Kacyiru SDA Church" },
  { year: "2025", title: "First Perfomance", description: "Debut performance at the annual church gathering" },
  { year: "2026", title: "First Concert", description: "We organised our first concert named AMAZING LOVE" },
];

const values = [
  { icon: Heart, title: "Faith", description: "Grounded in devotion to God and His word" },
  { icon: Users, title: "Unity", description: "Singing with one heart, one voice, one purpose" },
  { icon: Award, title: "Excellence", description: "Striving for the highest quality in all we do" },
  { icon: Music, title: "Passion", description: "Bringing genuine emotion to every performance" },
];

export default function About() {
  useDocumentTitle("About Us");
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-charcoal to-background" />
          <div className="container mx-auto px-4 relative z-10">
            <Stagger className="max-w-3xl mx-auto text-center" stagger={0.1}>
              <StaggerItem>
                <span className="inline-block text-primary text-sm font-semibold tracking-wider uppercase mb-4">
                  About Us
                </span>
              </StaggerItem>
              <StaggerItem>
                <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
                  The <span className="gold-text">Serenades</span>
                </h1>
              </StaggerItem>
              <StaggerItem>
                <p className="text-xl text-muted-foreground">
                  A journey of faith, harmony, and praise
                </p>
              </StaggerItem>
            </Stagger>
          </div>
        </section>

        {/* Image & History */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <Reveal direction="right" className="relative">
                <TiltCard maxTilt={8} className="rounded-3xl overflow-hidden gold-glow-lg">
                  <img
                    src={choirImage}
                    alt="Serenades of Praise Choir"
                    className="w-full h-auto object-cover"
                  />
                </TiltCard>
                <div className="absolute -bottom-6 -right-6 w-28 h-28 bg-gold-gradient rounded-2xl flex flex-col items-center justify-center">
                  <span className="font-display text-3xl font-bold text-primary-foreground">
                    <AnimatedCounter value={2} />
                  </span>
                  <span className="text-xs font-semibold text-primary-foreground/80 uppercase tracking-wide">Years</span>
                </div>
              </Reveal>
              
              <Reveal direction="left" delay={0.1}>
                <span className="text-primary text-sm font-semibold tracking-wider uppercase mb-4 block">Our History</span>
                <h2 className="font-display text-4xl font-bold mb-6">
                  Born from a <span className="gold-text">Passion</span> for Praise
                </h2>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  The Serenades of Praise Choir was founded on January 1st, 2024, at Kacyiru SDA Church in Kigali, Rwanda. What began as a small group of passionate singers has grown into a vibrant ministry dedicated to spreading the gospel through music.
                </p>
                <p className="text-muted-foreground mb-8 leading-relaxed">
                  Our choir brings together talented individuals united by their love for God and sacred music. We believe in the power of harmonious praise to touch hearts, inspire faith, and create transformative worship experiences.
                </p>
                
                {/* Timeline */}
                <Stagger className="space-y-4" stagger={0.12}>
                  {milestones.map((milestone, index) => (
                    <StaggerItem key={index} direction="right" className="flex gap-4 items-start group">
                      <div className="w-16 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 transition-colors duration-300 group-hover:bg-primary/25">
                        <span className="text-xs font-semibold text-primary">{milestone.year}</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">{milestone.title}</h4>
                        <p className="text-sm text-muted-foreground">{milestone.description}</p>
                      </div>
                    </StaggerItem>
                  ))}
                </Stagger>
              </Reveal>
            </div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="py-20 bg-charcoal section-pattern">
          <div className="container mx-auto px-4">
            <Stagger className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto" stagger={0.12}>
              {[
                {
                  icon: Target,
                  title: "Our Mission",
                  body: "To spread the gospel of Jesus Christ through the ministry of sacred music, touching hearts and transforming lives across Rwanda and beyond. We aim to create worship experiences that draw people closer to God.",
                },
                {
                  icon: Eye,
                  title: "Our Vision",
                  body: "To become a beacon of praise and worship, inspiring communities through harmonious music and spiritual devotion. We envision a ministry that reaches hearts globally through our songs and performances.",
                },
                {
                  icon: Heart,
                  title: "Our Values",
                  body: "Unity, excellence, spirituality, and service guide everything we do in our musical ministry.",
                },
              ].map((pillar) => (
                <StaggerItem key={pillar.title}>
                  <TiltCard className="card-glass rounded-3xl p-10 h-full group">
                    <div className="w-16 h-16 rounded-2xl bg-gold-gradient flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-[var(--shadow-gold)]">
                      <pillar.icon className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <h3 className="font-display text-2xl font-bold text-foreground mb-4">{pillar.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{pillar.body}</p>
                  </TiltCard>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>

        {/* Values */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <Stagger className="text-center mb-16" stagger={0.1}>
              <StaggerItem>
                <span className="text-primary text-sm font-semibold tracking-wider uppercase mb-4 block">Core Values</span>
              </StaggerItem>
              <StaggerItem>
                <h2 className="font-display text-4xl md:text-5xl font-bold">
                  What <span className="gold-text">Guides</span> Us
                </h2>
              </StaggerItem>
            </Stagger>
            
            <Stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8" stagger={0.1}>
              {values.map((value) => (
                <StaggerItem key={value.title} className="text-center group">
                  <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6 group-hover:bg-gold-gradient group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                    <value.icon className="w-10 h-10 text-primary group-hover:text-primary-foreground transition-colors" />
                  </div>
                  <h3 className="font-display text-xl font-semibold text-foreground mb-2">{value.title}</h3>
                  <p className="text-muted-foreground text-sm">{value.description}</p>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-charcoal">
          <Stagger className="container mx-auto px-4 text-center" stagger={0.1}>
            <StaggerItem>
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
                Want to Be Part of Our <span className="gold-text">Story</span>?
              </h2>
            </StaggerItem>
            <StaggerItem>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                Support our ministry and help us spread God's message through music.
              </p>
            </StaggerItem>
            <StaggerItem>
              <Button variant="hero" size="xl" asChild>
                <Link to="/contact">Get in Touch</Link>
              </Button>
            </StaggerItem>
          </Stagger>
        </section>
      </main>
      <Footer />
    </div>
  );
}
