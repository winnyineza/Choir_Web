import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Target, Eye, Heart, Users, Calendar, Award, Music } from "lucide-react";
import choirImage from "@/assets/choir-group.jpg";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

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
            <div className="max-w-3xl mx-auto text-center">
              <span className="inline-block text-primary text-sm font-semibold tracking-wider uppercase mb-4 animate-fade-in-up">
                About Us
              </span>
              <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold mb-6 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
               The <span className="gold-text">Serenades</span>
              </h1>
              <p className="text-xl text-muted-foreground animate-fade-in-up" style={{ animationDelay: "200ms" }}>
                A journey of faith, harmony, and praise
              </p>
            </div>
          </div>
        </section>

        {/* Image & History */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="relative">
                <div className="rounded-3xl overflow-hidden gold-glow-lg">
                  <img
                    src={choirImage}
                    alt="Serenades of Praise Choir"
                    className="w-full h-auto object-cover"
                  />
                </div>
                <div className="absolute -bottom-6 -right-6 w-28 h-28 bg-gold-gradient rounded-2xl flex flex-col items-center justify-center">
                  <span className="font-display text-3xl font-bold text-primary-foreground">2</span>
                  <span className="text-xs font-semibold text-primary-foreground/80 uppercase tracking-wide">Years</span>
                </div>
              </div>
              
              <div>
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
                <div className="space-y-4">
                  {milestones.map((milestone, index) => (
                    <div key={index} className="flex gap-4 items-start">
                      <div className="w-16 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-semibold text-primary">{milestone.year}</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">{milestone.title}</h4>
                        <p className="text-sm text-muted-foreground">{milestone.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="py-20 bg-charcoal section-pattern">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <div className="card-glass rounded-3xl p-10">
                <div className="w-16 h-16 rounded-2xl bg-gold-gradient flex items-center justify-center mb-6">
                  <Target className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="font-display text-2xl font-bold text-foreground mb-4">Our Mission</h3>
                <p className="text-muted-foreground leading-relaxed">
                  To spread the gospel of Jesus Christ through the ministry of sacred music, touching hearts and transforming lives across Rwanda and beyond. We aim to create worship experiences that draw people closer to God.
                </p>
              </div>
              
              <div className="card-glass rounded-3xl p-10">
                <div className="w-16 h-16 rounded-2xl bg-gold-gradient flex items-center justify-center mb-6">
                  <Eye className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="font-display text-2xl font-bold text-foreground mb-4">Our Vision</h3>
                <p className="text-muted-foreground leading-relaxed">
                  To become a beacon of praise and worship, inspiring communities through harmonious music and spiritual devotion. We envision a ministry that reaches hearts globally through our songs and performances.
                </p>
              </div>

              <div className="card-glass rounded-3xl p-10">
                <div className="w-16 h-16 rounded-2xl bg-gold-gradient flex items-center justify-center mb-6">
                  <Heart className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="font-display text-2xl font-bold text-foreground mb-4">Our Values</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Unity, excellence, spirituality, and service guide everything we do in our musical ministry.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <span className="text-primary text-sm font-semibold tracking-wider uppercase mb-4 block">Core Values</span>
              <h2 className="font-display text-4xl md:text-5xl font-bold">
                What <span className="gold-text">Guides</span> Us
              </h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value, index) => (
                <div
                  key={value.title}
                  className="text-center group"
                >
                  <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6 group-hover:bg-gold-gradient group-hover:scale-110 transition-all duration-300">
                    <value.icon className="w-10 h-10 text-primary group-hover:text-primary-foreground transition-colors" />
                  </div>
                  <h3 className="font-display text-xl font-semibold text-foreground mb-2">{value.title}</h3>
                  <p className="text-muted-foreground text-sm">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-charcoal">
          <div className="container mx-auto px-4 text-center">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
              Want to Be Part of Our <span className="gold-text">Story</span>?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Join our choir family and use your musical gifts to serve God's kingdom.
            </p>
            <Button variant="hero" size="xl" asChild>
              <Link to="/join">Join the Serenades</Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
