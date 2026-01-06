import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Users, Heart, Music, ArrowRight } from "lucide-react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

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
            <div className="max-w-3xl mx-auto text-center">
              <span className="inline-block text-primary text-sm font-semibold tracking-wider uppercase mb-4">
                Join Us
              </span>
              <h1 className="font-display text-5xl md:text-6xl font-bold mb-6">
                Be Part of <span className="gold-text">The Serenades</span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Use your gifts to glorify God and touch hearts through music
              </p>
            </div>
          </div>
        </section>

        {/* Selection Cards */}
        {!joinType && (
          <section className="py-16">
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">

                {/* Choir Member */}
                <button
                  onClick={() =>
                    window.open(
                      "https://docs.google.com/forms/d/e/1FAIpQLSdsuzRbfqdEmUS6zv6s958E8iLeK4LbT31txMhY-w3MlCv6LQ/viewform?usp=dialog",
                      "_blank"
                    )
                  }
                  className="card-glass rounded-3xl p-10 text-left hover:border-primary/50 transition-all duration-300 group"
                >
                  <div className="w-16 h-16 rounded-2xl bg-gold-gradient flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Music className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <h3 className="font-display text-2xl font-bold text-foreground mb-3">
                    Join as Choir Member
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Sing with us, attend rehearsals, and perform at events. Share
                    your vocal talents in service of God's kingdom.
                  </p>
                  <span className="inline-flex items-center text-primary font-semibold">
                    Get Started <ArrowRight className="w-4 h-4 ml-2" />
                  </span>
                </button>

                {/* Supporter */}
                <button
                  onClick={() =>
                    window.open(
                      "https://docs.google.com/forms/d/e/1FAIpQLSdLBwiLWcEjhzCXmZIVGKw0QCD1-3IXWA8xCeUMFbmYpgwbLg/viewform?usp=dialog",
                      "_blank"
                    )
                  }
                  className="card-glass rounded-3xl p-10 text-left hover:border-primary/50 transition-all duration-300 group"
                >
                  <div className="w-16 h-16 rounded-2xl bg-gold-gradient flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Heart className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <h3 className="font-display text-2xl font-bold text-foreground mb-3">
                    Join as Supporter
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Support our ministry through prayer, resources, and
                    encouragement. Be part of our extended family.
                  </p>
                  <span className="inline-flex items-center text-primary font-semibold">
                    Get Started <ArrowRight className="w-4 h-4 ml-2" />
                  </span>
                </button>

              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
