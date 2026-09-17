import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Heart, Music, ArrowRight } from "lucide-react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Stagger, StaggerItem, TiltCard } from "@/components/motion";

export default function Join() {
  useDocumentTitle("Join the Choir");
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {/* Hero */}
        <section className="relative pt-32 pb-16 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-charcoal to-background" />
          <div className="container mx-auto px-4 relative z-10">
            <Stagger className="max-w-3xl mx-auto text-center" stagger={0.1}>
              <StaggerItem>
                <span className="inline-block text-primary text-sm font-semibold tracking-wider uppercase mb-4">
                  Join Us
                </span>
              </StaggerItem>
              <StaggerItem>
                <h1 className="font-display text-5xl md:text-6xl font-bold mb-6">
                  Be Part of <span className="gold-text">The Serenades</span>
                </h1>
              </StaggerItem>
              <StaggerItem>
                <p className="text-xl text-muted-foreground">
                  Use your gifts to glorify God and touch hearts through music
                </p>
              </StaggerItem>
            </Stagger>
          </div>
        </section>

        {/* Selection Cards */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <Stagger className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto" stagger={0.14}>
              {[
                {
                  icon: Music,
                  title: "Join as Choir Member",
                  body: "Sing with us, attend rehearsals, and perform at events. Share your vocal talents in service of God's kingdom.",
                  href: "https://docs.google.com/forms/d/e/1FAIpQLSdsuzRbfqdEmUS6zv6s958E8iLeK4LbT31txMhY-w3MlCv6LQ/viewform?usp=dialog",
                  direction: "right" as const,
                },
                {
                  icon: Heart,
                  title: "Join as Supporter",
                  body: "Support our ministry through prayer, resources, and encouragement. Be part of our extended family.",
                  href: "https://docs.google.com/forms/d/e/1FAIpQLSdLBwiLWcEjhzCXmZIVGKw0QCD1-3IXWA8xCeUMFbmYpgwbLg/viewform?usp=dialog",
                  direction: "left" as const,
                },
              ].map((option) => (
                <StaggerItem key={option.title} direction={option.direction}>
                  <TiltCard className="h-full rounded-3xl">
                    <button
                      onClick={() => window.open(option.href, "_blank")}
                      className="card-glass rounded-3xl p-10 text-left hover:border-primary/50 transition-all duration-300 group w-full h-full"
                    >
                      <div className="w-16 h-16 rounded-2xl bg-gold-gradient flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-[var(--shadow-gold)]">
                        <option.icon className="w-8 h-8 text-primary-foreground" />
                      </div>
                      <h3 className="font-display text-2xl font-bold text-foreground mb-3">
                        {option.title}
                      </h3>
                      <p className="text-muted-foreground mb-6">{option.body}</p>
                      <span className="inline-flex items-center text-primary font-semibold">
                        Get Started
                        <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-300 group-hover:translate-x-1" />
                      </span>
                    </button>
                  </TiltCard>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
