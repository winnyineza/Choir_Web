import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { BookOpen, MapPin, Calendar, Youtube, Music, Heart, ArrowRight, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { AnimatedCounter, Reveal, Stagger, StaggerItem, TiltCard } from "@/components/motion";
import { useState, useEffect } from "react";
import { getLatestMusicVideo, type MusicVideo } from "@/lib/releaseService";
import { getAllMembers } from "@/lib/dataService";
import { PageHero } from "@/components/editorial";
import ministryHero from "@/assets/Choir01.jpg";

export default function Ministry() {
  useDocumentTitle("Our Ministry");
  const [featuredVideo, setFeaturedVideo] = useState<MusicVideo | null>(null);
  const [memberCount, setMemberCount] = useState(0);

  useEffect(() => {
    (async () => {
      const [video, members] = await Promise.all([getLatestMusicVideo(), getAllMembers()]);
      setFeaturedVideo(video || null);
      setMemberCount(members.filter(m => m.status === "Active").length);
    })();
  }, []);

  // `count` marks the one stat that is a real number, so it can tick up on scroll.
  const ministryStats = [
    { label: "Ministry Focus", value: "Music", icon: Music, count: undefined },
    { label: "Community", value: "Growing", icon: Heart, count: undefined },
    {
      label: "Active Members",
      value: memberCount > 0 ? `${memberCount}` : "—",
      icon: Users,
      count: memberCount > 0 ? memberCount : undefined,
    },
    { label: "Location", value: "Rwanda", icon: MapPin, count: undefined },
  ];
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <PageHero
          eyebrow="The ministry"
          title={<>Serving through <span className="italic text-primary">sacred</span> music</>}
          lede="From ministry trips to daily devotions, discover how we serve God's kingdom."
          image={ministryHero}
          imageAlt="Members of Serenades of Praise"
        />

        {/* Ministry Stats */}
        <section className="py-12 border-b border-primary/10">
          <div className="container mx-auto px-4">
            <Stagger className="grid grid-cols-2 md:grid-cols-4 gap-6" stagger={0.1}>
              {ministryStats.map((stat) => (
                <StaggerItem key={stat.label}>
                  <div className="text-center group">
                    <div className="w-12 h-12 rounded-xl bg-gold-gradient mx-auto mb-3 flex items-center justify-center transition-transform duration-300 group-hover:scale-[1.03]">
                      <stat.icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <p className="text-2xl md:text-3xl font-bold gold-text">
                      {stat.count !== undefined ? <AnimatedCounter value={stat.count} /> : stat.value}
                    </p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>

        {/* About Our Ministry */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <Stagger className="text-center mb-12" stagger={0.1}>
                <StaggerItem>
                  <span className="text-primary text-sm font-semibold tracking-wider uppercase mb-2 block">
                    About Us
                  </span>
                </StaggerItem>
                <StaggerItem>
                  <h2 className="font-display text-4xl font-bold mb-6">
                    Our <span className="gold-text">Mission</span>
                  </h2>
                </StaggerItem>
                <StaggerItem>
                  <p className="text-muted-foreground text-lg">
                    We are dedicated to spreading the gospel through sacred music. Our choir travels across Rwanda 
                    to share worship, fellowship, and spiritual nourishment with communities everywhere.
                  </p>
                </StaggerItem>
              </Stagger>

              <Stagger className="grid grid-cols-1 md:grid-cols-3 gap-6" stagger={0.12}>
                {[
                  { icon: Music, title: "Worship", body: "Leading hearts to God through powerful worship music and hymns." },
                  { icon: Heart, title: "Fellowship", body: "Building community through shared faith and musical ministry." },
                  { icon: BookOpen, title: "Devotion", body: "Nurturing spiritual growth through daily reflection and prayer." },
                ].map((pillar) => (
                  <StaggerItem key={pillar.title}>
                    <TiltCard className="card-glass rounded-2xl p-6 text-center h-full group">
                      <div className="w-12 h-12 rounded-xl bg-gold-gradient mx-auto mb-4 flex items-center justify-center transition-all duration-300 group-hover:scale-[1.03] group-hover:shadow-[var(--shadow-gold)]">
                        <pillar.icon className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <h3 className="font-display text-xl font-semibold text-foreground mb-2">{pillar.title}</h3>
                      <p className="text-muted-foreground text-sm">{pillar.body}</p>
                    </TiltCard>
                  </StaggerItem>
                ))}
              </Stagger>
            </div>
          </div>
        </section>

        {/* Featured Video - Only show if video exists */}
        {featuredVideo && (
          <section className="py-20 bg-charcoal section-pattern">
            <div className="container mx-auto px-4">
              <Reveal className="max-w-3xl mx-auto">
                <div className="card-glass rounded-3xl p-8">
                  <span className="text-primary text-sm font-semibold tracking-wider uppercase mb-4 block">
                    Featured Release
                  </span>
                  <div className="rounded-2xl overflow-hidden mb-4 gold-glow">
                    <iframe
                      width="100%"
                      height="315"
                      src={`https://www.youtube.com/embed/${featuredVideo.youtubeId}`}
                      title={featuredVideo.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full aspect-video"
                    />
                  </div>
                  <h3 className="font-display text-2xl font-semibold text-foreground mb-2">
                    {featuredVideo.title}
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Experience the power of worship through our featured release.
                  </p>
                  <div className="flex gap-4">
                    <Button variant="outline" className="flex-1" asChild>
                      <a href={`https://www.youtube.com/watch?v=${featuredVideo.youtubeId}`} target="_blank" rel="noopener noreferrer">
                        <Youtube className="w-4 h-4 mr-2" />
                        Watch on YouTube
                      </a>
                    </Button>
                    <Button variant="outline" className="flex-1" asChild>
                      <a href="https://open.spotify.com/user/31vkr3pk5yd5y2mpocfhibr4xbfm" target="_blank" rel="noopener noreferrer">
                        <Music className="w-4 h-4 mr-2" />
                        Listen on Spotify
                      </a>
                    </Button>
                  </div>
                </div>
              </Reveal>
            </div>
          </section>
        )}

        {/* Support Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <Reveal className="max-w-4xl mx-auto card-glass rounded-3xl p-10 text-center">
              <div className="w-16 h-16 rounded-full bg-gold-gradient mx-auto mb-6 flex items-center justify-center">
                <Heart className="w-8 h-8 text-primary-foreground" />
              </div>
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
                Support Our <span className="gold-text">Ministry</span>
              </h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                Your generous contributions help us continue spreading the gospel through music, funding trips, equipment, and outreach programs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="gold" size="lg" asChild className="group">
                  <Link to="/support">
                    Support Now
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button variant="gold-outline" size="lg" asChild>
                  <Link to="/contact">
                    Contact Us
                  </Link>
                </Button>
              </div>
            </Reveal>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
